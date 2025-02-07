import { Coin } from 'src/abstract';
import { HasBlockScanner, HasProviders, HasTokensMixin } from 'src/coins/mixins';
import { NODE_PROVIDER_OPERATION, TOKEN_PROVIDER_OPERATION } from 'src/coins/mixins/HasProviders';
import { NftMixin } from 'src/coins/nfts/mixins';
import SolanaNodeExplorer from 'src/explorers/collection/SolanaNodeExplorer';
import SolanaTritonExplorer from 'src/explorers/collection/SolanaTritonExplorer';
import { SOLToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';
import { STAKE_ADDR_TYPE } from 'src/utils/const';

import BANNED_TOKENS_CACHE from '../../resources/eth/tokens-banned.json';
import TOKENS_CACHE from '../../resources/eth/tokens.json';

const NAME = 'Solana';
const TICKER = 'SOL';
const DERIVATION = "m/44'/501'/0'";
const DECIMAL = 9;
const UNSPENDABLE_BALANCE = '0';
const DEFAULT_FEES = '7000';
const DEFAULT_RESERVE_FOR_STAKE = '28000';
const STAKE_MULTIPLIER = 2;
const STAKE_DATA_LENGTH = 200;

const solanaWeb3Lib = 'solanaWeb3Lib';
const hdKeyLib = 'hdKeyLib';
const tweetnaclLib = 'tweetnaclLib';

class SOLCoin extends NftMixin(HasProviders(HasBlockScanner(HasTokensMixin(Coin)))) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param  {object} config
   */
  constructor(config, db, configManager) {
    super(
      {
        ...config,
        name: config.name ?? NAME,
        ticker: config.ticker ?? TICKER,
        decimal: DECIMAL,
        unspendableBalance: UNSPENDABLE_BALANCE,
        dependencies: {
          [solanaWeb3Lib]: new LazyLoadedLib(() => import('@solana/web3.js')),
          [hdKeyLib]: new LazyLoadedLib(() => import('ed25519-hd-key')),
          [tweetnaclLib]: new LazyLoadedLib(() => import('tweetnacl')),
        },
      },
      db,
      configManager,
    );

    this.derivation = DERIVATION;

    this.setExplorersModules([SolanaNodeExplorer, SolanaTritonExplorer]);

    this.loadExplorers(config);

    const { feeData } = config;

    this.fee = feeData.fee || DEFAULT_FEES;
    this.feeData = feeData;
    this.feePerByte = 0;
    this.coefficient = 0;
    this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
    this.balances = {};

    /** @type {{ [id: string]: SOLToken }} */
    this.tokens = {};
    /** @type {string[]} */
    this.bannedTokens = [];
  }

  getPrivateKey() {
    return Buffer.from(this.#privateKey, 'hex');
  }

  async loadWallet(seed) {
    const { Keypair } = await this.loadLib(solanaWeb3Lib);
    const { derivePath } = await this.loadLib(hdKeyLib);
    const { default: nacl } = await this.loadLib(tweetnaclLib);

    const hdPrivateKey = derivePath(DERIVATION, seed).key;
    const { secretKey, publicKey } = this.generateKeys(Keypair, nacl, hdPrivateKey);

    // Convert a Solana secret key to a hex string
    // where each byte of data is represented as a two-character hexadecimal number
    this.#privateKey = secretKey.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    this.address = publicKey.toString();

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Creates unsigned transaction
   * @param {string} address
   * @param {string} amount
   * @returns {Promise<*>} Unsigned transaction
   */
  async createTransaction({ address, amount }) {
    const { Transaction, SystemProgram, PublicKey } = await this.loadLib(solanaWeb3Lib);

    return new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(this.address),
        toPubkey: new PublicKey(address),
        lamports: amount,
      }),
    );
  }

  async createTokenTransaction({ mint, address, amount, decimals, transfer }) {
    return { mint, address, amount, decimals, transfer };
  }

  /**
   * Gets the fee
   *
   * @return {Promise<BN>} - The fee.
   */
  async getFee() {
    try {
      const fees = await this.getProvider('balance').getFee();

      return new this.BN(fees);
    } catch {
      return new this.BN(this.fee);
    }
  }

  /**
   * Gets the fee required to transfer the NFT
   *
   * @return {Promise<BN>} - The fee.
   */
  getNftFee() {
    return this.getFee();
  }

  async sendTransaction(rawtx) {
    if (rawtx.transfer) {
      const { mint, address, amount, decimals } = rawtx;

      return this.sendTokenTransaction({ mint, address, amount, decimals });
    }

    const { Transaction, PublicKey } = await this.loadLib(solanaWeb3Lib);

    if (!(rawtx instanceof Transaction)) {
      return this.getProvider('send').sendRawTransaction(rawtx);
    }

    const signer = {
      secretKey: this.getPrivateKey(),
      publicKey: new PublicKey(this.address),
    };

    return this.getProvider('send').sendTransaction({ rawtx, signer });
  }

  async validateAddress(address) {
    const { PublicKey } = await this.loadLib(solanaWeb3Lib);

    try {
      const pubKey = new PublicKey(address);

      return PublicKey.isOnCurve(pubKey);
    } catch {
      return false;
    }
  }

  async connectSocket() {
    this.getProvider('node').connectSocket(this.address);
  }

  /**
   * Generates a new pair of secret and public keys
   *
   * @param {import('@solana/web3.js').Keypair} Keypair
   * @param {import('tweetnacl').default} nacl
   * @param {any} [hdPrivateKey=null] - If not set - a new key will be generated
   * @returns {secretKey: Uint8Array, publicKey: PublicKey} The newly generated keys.
   */
  generateKeys(Keypair, nacl, hdPrivateKey = null) {
    const { _keypair: keyPair } = hdPrivateKey
      ? new Keypair(nacl.sign.keyPair.fromSeed(hdPrivateKey).secretKey)
      : new Keypair(nacl.sign.keyPair().secretKey);

    return Keypair.fromSecretKey(keyPair);
  }

  async createStakeAccount(address, amount) {
    const [{ Keypair, PublicKey, Authorized, Lockup, StakeProgram }, { default: nacl }] = await Promise.all([
      this.loadLib(solanaWeb3Lib),
      this.loadLib(tweetnaclLib),
    ]);

    const { secretKey, publicKey } = this.generateKeys(Keypair, nacl);

    const fromPubkey = new PublicKey(address);
    const stakePubkey = publicKey;
    const stakeSeckey = secretKey;
    const authorized = new Authorized(fromPubkey, fromPubkey);
    const lockup = new Lockup(0, 0, fromPubkey);
    const lamports = Number(amount);
    const transaction = StakeProgram.createAccount({
      fromPubkey,
      stakePubkey,
      authorized,
      lockup,
      lamports,
    });

    return {
      createStakeAccountInstructions: transaction.instructions,
      stakePubkey,
      stakeSeckey,
      authorized,
      lockup,
    };
  }

  async createDelegationTransaction({ validator, amount }) {
    const { PublicKey, StakeProgram, Transaction } = await this.loadLib(solanaWeb3Lib);

    const { createStakeAccountInstructions, stakePubkey, stakeSeckey, authorized } = await this.createStakeAccount(
      this.address,
      amount,
    );

    const votePubkey = new PublicKey(validator); // validator pubkey
    const params = {
      stakePubkey,
      authorizedPubkey: authorized.staker,
      votePubkey,
    };

    const delegate = StakeProgram.delegate(params);

    const instructions = [...createStakeAccountInstructions, ...delegate.instructions];

    const transaction = new Transaction();

    transaction.add(...instructions);

    const signers = [
      {
        publicKey: authorized.staker,
        secretKey: Buffer.from(this.#privateKey, 'hex'),
      },
      {
        publicKey: stakePubkey,
        secretKey: stakeSeckey,
      },
    ];

    const { blockhash } = await this.getProvider('node').getLatestBlock();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authorized.staker;
    transaction.sign(...signers);

    const db = this.getDbTable('addrCache');

    const address = stakePubkey.toBase58();

    await db.put({ id: address, ticker: this.ticker, type: STAKE_ADDR_TYPE, address });

    return transaction.serialize();
  }

  /**
   * Deactivate stake account
   *
   * @param stakeAddress
   * @param ownerAddress
   * @returns {Promise<Transaction>}
   */
  async createDeactivateStakeTransaction({ stakeAccount, ownerAddress = this.address }) {
    const { PublicKey, StakeProgram } = await this.loadLib(solanaWeb3Lib);

    const stakePubkey = new PublicKey(stakeAccount);
    const authorizedPubkey = new PublicKey(ownerAddress);

    const params = { stakePubkey, authorizedPubkey };

    return StakeProgram.deactivate(params);
  }

  /**
   * Withdraw DEACTIVATED only stake account
   *
   * @param stakeAddress
   * @param ownerAddress
   * @param amount
   * @returns {Promise<Buffer>}
   */
  async createUndelegationTransaction({ stakeAccount, ownerAddress = this.address, amount }) {
    const { PublicKey, StakeProgram } = await this.loadLib(solanaWeb3Lib);

    const stakePubkey = new PublicKey(stakeAccount); // staking account pubkey
    const authorizedPubkey = new PublicKey(ownerAddress); // owner pubkey
    const toPubkey = new PublicKey(ownerAddress); // where to withdraw (staking or owner)
    const params = {
      stakePubkey,
      authorizedPubkey,
      toPubkey,
      custodianPubkey: authorizedPubkey,
      lamports: amount,
    };

    return StakeProgram.withdraw(params);
  }

  async getInfo(props) {
    if (props?.isToken) {
      const tokenBalance = await this.getTokenInfo({ mint: props.mint });

      if (tokenBalance !== null) {
        const contractVariant = [props.contract, props.contract.toLowerCase()];

        contractVariant.forEach((contract) => {
          if (this.tokens[contract] && tokenBalance) {
            this.tokens[contract].balance = tokenBalance;
          }
        });
      }
    }

    const balance = await this.getProvider('balance').getBalance(this.address, true);

    if (balance) {
      this.balance = balance;
    }

    const getStakingBalanceProps = {
      address: this.address,
      ignoreCache: props?.ignoreCache || false,
    };
    const balances = await this.getProvider('stake').getStakingBalance(getStakingBalanceProps);
    const fee = await this.getFee();
    const feeForStake = fee.mul(new this.BN(STAKE_MULTIPLIER));
    const availableForStake = new this.BN(balance).sub(new this.BN(feeForStake)).sub(new this.BN(this.reserveForStake));

    if (balances) {
      balances.availableForStake = Number(availableForStake) > 0 ? this.toCurrencyUnit(availableForStake) : '0';

      this.balances = balances;
    }

    return { balance, balances: this.balances };
  }

  async getAccountInfo(address) {
    const { PublicKey } = await this.loadLib(solanaWeb3Lib);

    return this.getProvider('node').getAccountInfo(new PublicKey(address || this.address));
  }

  /**
   * Fetch minimal amount for stake
   * @param length
   * @returns {*}
   */
  getMinRent(length = STAKE_DATA_LENGTH) {
    return this.getProvider('node').getMinRent(length);
  }

  async convertToPubkey(address) {
    const { PublicKey } = await this.loadLib(solanaWeb3Lib);

    return new PublicKey(address);
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }

  /**
   * @typedef ConfigTokenShape
   * @type {object}
   * @property {string} name
   * @property {string} ticker
   * @property {number} decimal
   * @property {string} contract
   * @property {boolean} visibility
   *
   */

  /**
   * Returns all token list data
   *
   * @returns {Promise<ConfigTokenShape[]>}
   */
  async getTokenList() {
    this.bannedTokens = await this.getBannedTokenList();

    const tokens = await this.configManager.get(ConfigKey.SolTokens);

    return tokens ?? TOKENS_CACHE;
  }

  /**
   * Returns banned token list
   *
   * @async
   * @returns {Promise<string[]>} - Array of contract addresses
   */
  async getBannedTokenList() {
    const banned = await this.configManager.get(ConfigKey.SolTokensBanned);
    return banned ?? BANNED_TOKENS_CACHE;
  }

  /**
   * @typedef ExplorerTokenShape
   * @type {object}
   * @property {string} name
   * @property {string} ticker
   * @property {number} decimal
   * @property {string} contract
   * @property {string} parentTicker
   * @property {string} uniqueField
   * @property {string[]} supportedStandards
   *
   */

  /**
   * Returns user token list data
   * @returns {Promise<ExplorerTokenShape[]>}
   */
  async getUserTokenList() {
    const provider = this.getProvider(TOKEN_PROVIDER_OPERATION);

    if (!provider?.getUserTokenList) {
      return [];
    }

    const userTokens = await provider.getUserTokenList(this.address);

    // Set the balance for found tokens
    userTokens.forEach(({ mint, tokenAmount: { amount, decimals } }) => {
      const userToken = this.tokens[mint] ?? this.tokens[mint.toLowerCase()];

      if (userToken) {
        userToken.decimal = decimals;
        userToken.balance = amount;
      }
    });

    return userTokens;
  }

  /**
   * Maps from common token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromCommonList(token, source) {
    return {
      name: token.name,
      ticker: token.symbol,
      decimal: token.decimal || 0,
      contract: token.mint.toLowerCase(),
      parentTicker: this.ticker,
      uniqueField: token.mint.toLowerCase(),
      visibility: token.visibility !== false,
      confirmed: token.confirmed,
      source: token.source || source,
      mint: token.mint,
      notify: Boolean(token.notify),
    };
  }

  /**
   * Maps from user token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromUserList(token, source) {
    return {
      ...this.getTokenFromCommonList({ ...token, decimal: token.decimals }, source),
      // The 'notify' field is for Atomic's internal use, explorers (the source of the 'user list') does not have it.
      // But we don't need to change this value, as it can be set in the native token list for this token.
      notify: token.notify,
    };
  }

  /**
   * Creates a token.
   *
   * @param {object} args - The arguments.
   * @return {SOLToken}
   */
  createToken(args) {
    return new SOLToken({
      parent: this,
      ...args,
    });
  }

  /**
   * Gets token balance
   *
   * @param {string} mint - Token contract address.
   * @returns {Promise<string|null>}
   */
  getTokenInfo({ mint }) {
    return this.getProvider(NODE_PROVIDER_OPERATION).getTokenBalance({
      address: this.address,
      mint,
    });
  }

  /**
   * Sends a token transaction.
   *
   * @async
   * @param {object} options - The options for the token transaction.
   * @param {string} options.mint - The address of the token mint.
   * @param {string} options.address - The address of the recipient.
   * @param {number} options.amount - The amount of tokens to send.
   * @param {number} options.decimals - The number of decimal places for the token.
   * @return {Promise} A promise that resolves with the transaction result.
   */
  async sendTokenTransaction({ mint, address, amount, decimals }) {
    return this.getProvider(TOKEN_PROVIDER_OPERATION).sendTokenTransaction(this, mint, address, amount, decimals);
  }

  async getTransactions(args) {
    try {
      if (!this.address) {
        throw new Error(`[${this.ticker}] getTransactions error: address is not loaded`);
      }

      return this.getProvider('history').getTransactions({
        address: this.address,
        ...args,
      });
    } catch (error) {
      // @TODO implement logger
      return this.transactions || [];
    }
  }
}

export default SOLCoin;

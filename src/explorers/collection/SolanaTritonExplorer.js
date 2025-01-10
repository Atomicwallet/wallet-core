import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  StakeProgram,
  Transaction as SolanaTransaction,
} from '@solana/web3.js';
import axios from 'axios';
import BN from 'bn.js';
import { getParsedNftAccountsByOwner, resolveToWalletAddress } from 'sol-rayz';
import { ExternalError } from 'src/errors';

import { SOLNftToken } from '../../coins/nfts';
import { chunkArray, getTokenId } from '../../utils';
import { EXTERNAL_ERROR, STAKE_ADDR_TYPE } from '../../utils/const';
import {
  convertSecondsToDateTime,
  getStringWithEnsuredEndChar,
  toCurrency,
} from '../../utils/convert';
import Explorer from '../Explorer';
// import history from '../History'
// import AddrCacheDb from '../AddrCacheDb'
import Transaction from '../Transaction';

const STAKE_DATA_LENGTH = 200;

const ATOMIC_HISTORY_SIGNATURES_CHUNK_SIZE = 500;
const BACKEND_TOKEN = 'ff2c5556-29f4-4ec0-8f4a-58a85f366aaf';
const ALLOWED_ORIGIN = 'atomicwallet.io';
const FINALIZED_COMMITMENT = 'finalized';

const SYSTEM_PROGRAM = 'system';
const TRANSFER_TYPE = 'transfer';

const TRANSFER_COIN = 'TRANSFER_COIN';
const TRANSFER_NFT = 'TRANSFER_NFT';
const TRANSFER_TOKEN = 'TRANSFER_TOKEN';

/**
 * @typedef DetectFunction
 * @type {function}
 * @param {ParsedConfirmedTransaction} tx
 * @returns {boolean}
 */

/** @type {DetectFunction} */
const getIsCoinTx = (tx) => {
  const {
    transaction: {
      message: { instructions: [{ program, parsed: { type } = {} }] = [{}] },
    } = {},
  } = tx || {};

  return program === SYSTEM_PROGRAM && type === TRANSFER_TYPE;
};

/** @type {DetectFunction} */
const getIsNftTx = (tx) => {
  const { meta: { postTokenBalances = [] } = {} } = tx || {};

  return (
    postTokenBalances.length > 0 &&
    postTokenBalances[0]?.uiTokenAmount?.decimals === 0
  );
};

/** @type {DetectFunction} */
const getIsTokenTx = (tx) => {
  const { meta: { postTokenBalances = [] } = {} } = tx || {};

  return (
    postTokenBalances.length > 0 &&
    postTokenBalances[0]?.uiTokenAmount?.decimals > 0
  );
};

/**
 * @typedef ParseFunction
 * @type {function}
 * @param {ParsedConfirmedTransaction} tx
 * @param {object}[] [tokensFromDb]
 * @returns {ParsedInstruction}
 */

/** @type {ParseFunction} */
const parseCoinTx = (tx) => {
  const {
    transaction: {
      message: {
        instructions: [
          {
            parsed: {
              info: { source, destination, lamports: amount = 0 },
            },
          },
        ],
      },
    },
  } = tx;

  return { source, destination, isNft: false, amount };
};

/** @type {ParseFunction} */
const parseNftTx = (tx) => {
  const {
    meta: { postTokenBalances },
  } = tx;

  const defaultInstruction = {
    source: '',
    destination: '',
    isNft: true,
    isToken: false,
    amount: '1',
    decimal: 0,
  };

  return postTokenBalances.reduce((instruction, tokenBalance) => {
    const {
      owner,
      uiTokenAmount: { amount },
    } = tokenBalance;

    switch (amount) {
      case '1':
        instruction.destination = owner;
        break;
      case '0':
        instruction.source = owner;
        break;
      default:
    }
    return instruction;
  }, defaultInstruction);
};

/** @type {ParseFunction} */
const parseTokenTx = (tx, tokensFromDb) => {
  const transferInstruction = tx.transaction?.message?.instructions.find(
    (instruction) => {
      return (
        instruction.program === 'spl-token' &&
        instruction.parsed.type === 'transferChecked'
      );
    },
  );

  const info = transferInstruction.parsed.info;

  if (!info) {
    throw new Error('Could not parse token tx');
  }

  const {
    tokenAmount: { amount, decimals: decimal } = {},
    destination = '',
    source,
    mint,
  } = info ?? { tokenAmount: {} };

  const symbol = tokensFromDb[mint.toLowerCase()]?.ticker;

  return {
    source,
    destination,
    isNft: false,
    isToken: true,
    amount,
    decimal,
    symbol,
    mint,
  };
};

/**
 * @type {Object.<string, {isMatch: DetectFunction, parse: ParseFunction}>}
 */
const TX_INSTRUCTION_PARSERS = {
  [TRANSFER_COIN]: {
    isMatch: getIsCoinTx,
    parse: parseCoinTx,
  },
  [TRANSFER_NFT]: {
    isMatch: getIsNftTx,
    parse: parseNftTx,
  },
  [TRANSFER_TOKEN]: {
    isMatch: getIsTokenTx,
    parse: parseTokenTx,
  },
};

/**
 * Solana Triton JSON-RCP explorer
 *
 * Official Solana JSON RPC API Reference:
 * https://docs.solana.com/developing/clients/jsonrpc-api#json-rpc-api-reference
 *
 */
class SolanaTritonExplorer extends Explorer {
  #finalizedSocketListenerId;
  #confirmedSocketListenerId;

  /**
   * Creates SolanaTritonExplorer
   * @param {Object} param
   * @param {Coin} param.wallet - Initialised Coin instance.
   * @param {{baseUrl: string}} param.config - Explorer config.
   */
  constructor({ wallet, config }) {
    super({ wallet, config });
    const actualBaseUrl = `${getStringWithEnsuredEndChar(config.baseUrl, '/')}${BACKEND_TOKEN}`;

    this.connection = new Connection(actualBaseUrl, {
      httpHeaders: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  }

  /**
   * Gets allowed tickers
   *
   * @returns {string[]}
   */
  getAllowedTickers() {
    return ['SOL'];
  }

  /**
   * Sets socket client.
   *
   * @param {string} endpoint
   * @memberof Explorer
   */
  setSocketClient(endpoint) {
    this.socket = new Connection(endpoint);
  }

  /**
   * Gets balance from blockchain
   *
   * @param {string} address
   * @returns {Promise<{balance: string}>} - The account balance
   * @throws {ExternalError}
   */
  async getInfo(address) {
    const pubKey = new PublicKey(address);

    const response = await this.connection.getBalance(pubKey, 'finalized');

    return { balance: String(response) };
  }

  /**
   * Gets a latest block
   *
   * @async
   * @returns {Promise<{blockhash: Blockhash, feeCalculator: FeeCalculator}>}
   */
  getLatestBlock() {
    return this.connection.getLatestBlockhash();
  }

  /**
   * Sends a transaction
   *
   * @param {string} rawtx - Unsigned raw transaction.
   * @param {Object} signer - The signer private key.
   * @returns {Promise<{txid: string}>} - The transaction id.
   * @throws {ExternalError}
   */
  async sendTransaction({ rawtx, signer }) {
    try {
      const txid = await this.connection.sendTransaction(rawtx, [signer]);

      return { txid };
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Sends a raw transaction
   *
   * @param {string} rawtx - Signed raw transaction.
   * @returns {Promise<{txid: string}>} - The transaction id.
   * @throws {ExternalError}
   */
  async sendRawTransaction(rawtx) {
    try {
      const txid = await this.connection.sendRawTransaction(rawtx);

      return { txid };
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Gets fee for send a transaction
   *
   * @returns {Promise<string>}
   * @throws {ExternalError}
   */
  async getFee() {
    try {
      const transaction = new SolanaTransaction();

      transaction.feePayer = this.wallet.address;
      const { blockhash } = await this.getLatestBlock();

      transaction.recentBlockhash = blockhash;

      // Assume that there are no operations, only a transaction structure to estimate the fee
      const message = transaction.compileMessage();
      const { value: fee } = await this.connection.getFeeForMessage(message);

      return String(fee);
    } catch (error) {
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  async getCurrentSigs(pubkey, commitment = 'finalize') {
    const sigs = await this.connection.getConfirmedSignaturesForAddress2(
      pubkey,
      {},
      commitment,
    );

    return sigs
      .map(({ confirmationStatus, signature }) => {
        if (confirmationStatus === commitment) {
          return signature;
        }

        return undefined;
      })
      .filter(Boolean);
  }

  getAccountInfo(pubKey) {
    const info = this.connection.getParsedAccountInfo(pubKey);

    return info;
  }

  getEpochInfo() {
    return this.connection.getEpochInfo('finalized');
  }

  getStakeProgramInfo(address) {
    return this.connection.getParsedProgramAccounts(StakeProgram.programId, {
      commitment: 'finalize',
      filters: [{ memcmp: { bytes: address, offset: 12 } }],
    });
  }

  /**
   * Fetch stake account info from the most recent block
   * which has reached 1 confirmation by the connected node (NOT THE WHOLE CLUSTER)
   * use commitment `confirmed` for 1 CLUSTER confirmation
   * or commitment `finalize` for whole cluster confirmation
   * @param address
   * @returns {Promise<{account: *, pubkey: *}>}
   */
  async getStakeAccountInfo(address) {
    const accountInfo = await this.connection.getParsedAccountInfo(
      new PublicKey(address),
      'processed',
    );

    return this.modifyStakeAccountInfo(accountInfo, address);
  }

  modifyStakeAccountInfo(response, address) {
    return { account: response.value, pubkey: new PublicKey(address) };
  }

  async getStakingBalance(props) {
    // fetch cached stake addresses from db
    // const cachedAddrRows = await AddrCacheDb.getAddrCache(this.wallet.ticker, STAKE_ADDR_TYPE)

    let addresses = [];

    // map addresses if cache exists
    // if (cachedAddrRows) {
    //   addresses = cachedAddrRows.map(({ address }) => address)
    // }

    // If cached addresses exists then get account info for each cached address
    // else fetch huge `getStakeProgramInfo` request to get all existing stake account for specified address
    const stakeAccounts =
      addresses.length > 0
        ? await Promise.all(
            addresses.map((address) => this.getStakeAccountInfo(address)),
          )
        : await this.getStakeProgramInfo(props.address);

    // re-map addresses from `getStakeProgramInfo` if no cache exists
    if ((addresses.length === 0 && stakeAccounts) || props.ignoreCache) {
      addresses = stakeAccounts.map(({ pubkey }) => {
        try {
          return pubkey.toBase58();
        } catch {
          return pubkey;
        }
      });

      // Insert addresses to DB, adding only new addresses
      // AddrCacheDb.setAddrCache({ ticker: this.wallet.ticker, type: STAKE_ADDR_TYPE, addresses })
    }

    const { epoch } = await this.getEpochInfo();

    const accounts = stakeAccounts
      .map((info) => {
        // for empty addresses
        // rm saved address if not exists on B/C
        if (!info.account) {
          // AddrCacheDb._removeItem(info.pubkey.toBase58())
          return undefined;
        }

        /**
         * @TODO only returns delegation for now, need to implement `deactivate` and `withdrawals`
         */
        if (info.account.data.parsed.type !== 'delegated') {
          return undefined;
        }

        const accountAddress = info.pubkey.toBase58();
        const staked = info.account.lamports;
        const validator = info.account.data.parsed.info.stake.delegation.voter;
        const isDeactivated = Number.isSafeInteger(
          Number(
            info.account.data.parsed.info.stake.delegation.deactivationEpoch,
          ),
        );
        const isAvailableForWithdraw =
          isDeactivated &&
          Number(
            info.account.data.parsed.info.stake.delegation.deactivationEpoch,
          ) < epoch;

        return {
          accountAddress,
          staked,
          validator,
          isDeactivated,
          isAvailableForWithdraw,
        };
      })
      .filter(Boolean);

    const staked = accounts.reduce((prev, cur) => {
      return prev.add(new this.wallet.BN(cur.staked));
    }, new this.wallet.BN(0));

    return {
      staking: accounts,
      staked,
      total: accounts.reduce((acc, next) => {
        return acc.add(new BN(next.staked));
      }, new BN(0)),
    };
  }

  /**
   * Fetch minimal amount for rent stake
   * @param length
   * @returns {Promise<number>}
   */
  getMinRent(length = STAKE_DATA_LENGTH) {
    return this.connection.getMinimumBalanceForRentExemption(length);
  }

  async connectSocket(address) {
    const { baseUrl, websocketUrl } = this.config;

    if (this.#finalizedSocketListenerId) {
      this.socket.removeAccountChangeListener(this.#finalizedSocketListenerId);
      this.#finalizedSocketListenerId = null;
    }
    if (this.#confirmedSocketListenerId) {
      this.socket.removeAccountChangeListener(this.#confirmedSocketListenerId);
      this.#confirmedSocketListenerId = null;
    }

    this.setSocketClient(websocketUrl || baseUrl);

    const pubkey = new PublicKey(address);

    if (this.socket) {
      this.#finalizedSocketListenerId = this.socket.onAccountChange(
        pubkey,
        (event) => this.processBalanceChangeEvent(event, pubkey),
        'finalized',
      );
      this.#confirmedSocketListenerId = this.socket.onAccountChange(
        pubkey,
        (event) => this.processTxsChangeEvent(event, pubkey),
        'confirmed',
      );
    }
  }

  updateParams(params) {
    super.updateParams(params);

    if (
      params.websocketUrl &&
      this.config.websocketUrl !== params.websocketUrl
    ) {
      this.config.websocketUrl = params.websocketUrl;
      this.connectSocket(this.wallet.address);
    }
  }

  async processTxsChangeEvent(event, pubkey) {
    const sigs = await this.getCurrentSigs(pubkey, 'confirmed');

    const txs = await this.getSpecifiedTransactions(sigs, pubkey.toBase58());

    // await history.filterAndUpdateTransactions(txs)

    txs.forEach((tx) => {
      if (tx.direction) {
        this.eventEmitter.emit(
          `${this.wallet.parent}-${this.wallet.id}::new-socket-tx`,
          {
            unconfirmedTx: tx,
          },
        );
      }
    });
  }

  processBalanceChangeEvent(event, pubkey) {
    this.eventEmitter.emit(
      `update::${this.wallet.id}::balance`,
      event.lamports,
    );
  }

  getTxConfirmations() {
    return 1;
  }

  /**
   * Fetch limited set of Tx signatures for the specified public key
   *
   * @param {PublicKey} pubKey - '@solana/web3.js' PublicKey
   * @param {number} limit - Search until this transaction signature is reached, if found before limit.
   * @returns {Promise<string[]>}
   */
  async fetchTxSignaturesForChunk(
    pubKey,
    limit = ATOMIC_HISTORY_SIGNATURES_CHUNK_SIZE,
  ) {
    try {
      return (
        await this.connection.getSignaturesForAddress(
          pubKey,
          { limit },
          FINALIZED_COMMITMENT,
        )
      ).map(({ signature }) => signature);
    } catch (error) {
      console.warn(error);

      return [];
    }
  }

  /**
   * @typedef ParsedInstruction
   * @type {object}
   * @property {string} source - Source address.
   * @property {string} destination - Destination address.
   * @property {boolean} isNft - Is NFT sign.
   * @property {boolean} isToken - Is NFT sign.
   * @property {string} amount - Amount.
   * @property {number} [decimal] - Decimals.
   * @property {string} [symbol] - Symbol.
   * @property {string} [mint] - Mint.
   */

  /**
   * Get cleaned tx instruction
   *
   * @param {ParsedConfirmedTransaction} tx
   * @param {object}[] tokensFromDb
   * @returns {ParsedInstruction}
   */
  getTxInstruction(tx, tokensFromDb) {
    const defaultInstruction = {
      destination: '',
      source: '',
      isNft: false,
      isToken: false,
      amount: '0',
      decimal: 0,
      symbol: '',
      mint: '',
    };

    return Object.entries(TX_INSTRUCTION_PARSERS).reduce(
      (instruction, [, { isMatch, parse }]) => {
        const parsed = isMatch(tx) ? parse(tx, tokensFromDb) : {};

        return { ...instruction, ...parsed };
      },
      defaultInstruction,
    );
  }

  getTxHash(tx) {
    return tx.transaction.signatures[0];
  }

  getTxDateTime(tx) {
    return convertSecondsToDateTime(tx.blockTime);
  }

  getTxMemo(tx) {
    return tx.memo || '';
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx.meta?.fee || 0);
  }

  /**
   * Fetch Txs for the specified signatures
   *
   * @param {string[]} signatures - Tx signatures array.
   * @returns {Promise<ParsedConfirmedTransaction[]>}
   */
  async fetchTxsForChunk(signatures) {
    try {
      return this.connection.getParsedTransactions(signatures, {
        commitment: FINALIZED_COMMITMENT,
        maxSupportedTransactionVersion: 0,
      });
    } catch (error) {
      console.warn(error);

      return [];
    }
  }

  /**
   * Fetch transactions for the specified address
   *
   * @param {Object} param
   * @param {string} param.address - Coin address.
   * @param {number} [param.limit] - Search until this transaction signature is reached, if found before limit.
   * @param {number} [param.pageNum=0] - Page number.
   * @returns {Promise<Transaction[]>}
   */
  async getTransactions({ address, limit = this.defaultTxLimit, pageNum = 0 }) {
    const signatures = await this.fetchTxSignaturesForChunk(
      new PublicKey(address),
      limit * (pageNum + 1),
    );

    const txs = await this.fetchTxsForChunk(
      chunkArray(signatures, limit)[pageNum] || [],
    );

    return this.modifyTransactionsResponse(txs, address);
  }

  /**
   * Create transactions from parsed transactions and address
   * @param {ParsedConfirmedTransaction[]} txs - Parsed confirmed transactions.
   * @param {string} selfAddress - Coin Address.
   * @returns {Transaction[]}
   */
  modifyTransactionsResponse(txs, selfAddress) {
    const tokensFromDb = Object.fromEntries(
      Object.entries(this.wallet.tokens()),
    );

    return txs.reduce((list, tx, index) => {
      try {
        const {
          source,
          destination,
          isNft,
          isToken,
          amount: txAmount,
          decimal,
          symbol,
          mint,
        } = this.getTxInstruction(tx, tokensFromDb);

        let amount;
        let walletid;

        if (isNft) {
          amount = 'NFT';
          walletid = this.wallet.id;
        } else if (isToken) {
          amount = `${toCurrency(txAmount, decimal)}`;
          walletid = getTokenId({
            contract: mint.toLowerCase(),
            parent: 'SOL',
            ticker: symbol,
          });
        } else {
          amount = `${toCurrency(txAmount, this.wallet.decimal)}`;
          walletid = this.wallet.id;
        }

        list.push(
          new Transaction({
            ticker: symbol || this.wallet.ticker,
            name: this.wallet.name,
            alias: this.wallet.alias,
            explorer: this.constructor.name,
            txid: this.getTxHash(tx),
            direction: destination === selfAddress,
            otherSideAddress:
              destination === selfAddress ? source : destination,
            amount,
            datetime: this.getTxDateTime(tx),
            memo: this.getTxMemo(tx),
            confirmations: this.getTxConfirmations(tx),
            fee: this.getTxFee(tx),
            feeTicker: this.getTxFeeTicker(),
            isNft,
            isToken,
            symbol,
            walletid,
            walletId: walletid,
          }),
        );

        return list;
      } catch (error) {
        console.warn('[SOL] tx parse failed');
        console.error(error);

        return list;
      }
    }, []);
  }

  /**
   * @typedef {Object} FetchRawListResponse
   * @param {string} id - NFT id.
   * @param {string} name - NFT name.
   * @param {string} description - NFT description.
   * @param {string} image - Url to NFT image.
   */

  /**
   * Fetch raw NFT list owned by {address}
   * @async
   * @param {string} address - Owner address
   * @returns {Promise<{FetchRawListResponse}[]>} - NFTs fetched metadata list.
   * @throws {ExternalError} - Throws error receiving NFT list
   */
  async fetchRawList(address) {
    try {
      const publicAddress = await resolveToWalletAddress({
        text: address,
        connection: this.connection,
      });

      const rawList = await getParsedNftAccountsByOwner({
        publicAddress,
        connection: this.connection,
      });
      const urls = [];

      const rawTokens = rawList.map(
        ({
          mint,
          // @TODO Research this
          // tokenStandard,
          data: { name, uri },
        }) => {
          urls.push(uri);
          return {
            tokenId: mint,
            name,
          };
        },
      );
      const additionalPropertyResults = await Promise.allSettled(
        urls.map((url) => axios.get(url)),
      );

      for (let index = 0; index < rawTokens.length; index++) {
        const token = rawTokens[index];
        const { status, value, reason } = additionalPropertyResults[index];

        if (status === 'fulfilled') {
          const {
            data: { description, image },
          } = value;

          token.description = description;
          token.imageUrl = image;
        } else {
          // @TODO token.description = 'Error getting token description'
          // @TODO token.imageUrl = '<Some error url>'
          console.warn(reason);
        }
      }
      return rawTokens;
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Gets Solana NFT list
   *
   * @async
   * @param {Object<Coin>} coin
   * @returns {Promise<SOLNftToken[]>}
   * @throws {ExternalError} - Throws error receiving NFT list
   */
  async fetchNftList(coin) {
    const { address, ticker } = coin;

    try {
      const rawList = await this.fetchRawList(address);

      return rawList.map(
        ({ tokenId, name, description, imageUrl }) =>
          new SOLNftToken(tokenId, ticker, name, description, imageUrl),
      );
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Send Solana NFT to other wallet
   *
   * @async
   * @param {Object<Coin>} coin
   * @param {string} toAddress - destination wallet address.
   * @param {string | null} contractAddress - Not used in Solana.
   * @param {string} tokenId - Token id - Solana NFT mint used as id.
   * @param {string} [tokenStandard] - Token standard - not used in Solana.
   * @param {Object} [options] - Not used here.
   * @returns {Promise<{tx: string}>} - Transaction hash.
   * @throws {ExternalError} - Throws transfer NFT error.
   */
  async sendNft(
    coin,
    toAddress,
    contractAddress,
    tokenId,
    tokenStandard,
    options,
  ) {
    const fromKeypair = Keypair.fromSecretKey(coin.getPrivateKey());

    // Mint is the Mint address found in the NFT metadata
    const mintPublicKey = new PublicKey(tokenId);
    const destPublicKey = new PublicKey(toAddress);

    try {
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        fromKeypair,
        mintPublicKey,
        fromKeypair.publicKey,
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        fromKeypair,
        mintPublicKey,
        destPublicKey,
      );

      const transaction = new SolanaTransaction().add(
        createTransferCheckedInstruction(
          fromTokenAccount.address,
          mintPublicKey,
          toTokenAccount.address,
          fromKeypair.publicKey,
          1,
          0,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );

      const tx = await this.connection.sendTransaction(transaction, [
        fromKeypair,
      ]);

      return { tx };
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Makes the NFT info url
   *
   * @param {string | null} contractAddress - Contract address (Not used here).
   * @param {string} tokenId - Token id.
   * @returns {string} - NFT info url.
   */
  makeNftInfoUrl(contractAddress, tokenId) {
    return `${getStringWithEnsuredEndChar(this.config.baseUrl, '/')}${tokenId}`;
  }

  /** @typedef TokenType
   * @type {object}
   * @property {}
   */

  async getUserTokenList() {
    const { value: splAccounts } =
      await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(this.wallet.address),
        {
          programId: new PublicKey(TOKEN_PROGRAM_ID),
        },
      );

    const rawTokensList = [];

    splAccounts.forEach((acc) => {
      if (
        acc.account.data.program === 'spl-token' &&
        acc.account.data.parsed.type === 'account'
      ) {
        rawTokensList.push(acc.account.data.parsed.info);
      }
    });

    return rawTokensList;
  }

  /**
   * Send Solana token to other wallet
   *
   * @async
   * @function sendTokenTransaction
   * @param {string} coin - The coin to be sent.
   * @param {string} mint - The mint address from which the coin will be sent.
   * @param {string} toAddress - The destination address where the coin will be sent.
   * @param {number} amount - The amount of coin to be sent.
   * @param {number} decimals - The decimals of the used coin.
   * @return {Promise<{ txid: string }>} - A Promise that resolves to the transaction ID.
   */
  async sendTokenTransaction(coin, mint, toAddress, amount, decimals) {
    const fromKeypair = Keypair.fromSecretKey(coin.getPrivateKey());

    // Mint is the Mint address found in the NFT metadata
    const mintPublicKey = new PublicKey(mint);
    const destPublicKey = new PublicKey(toAddress);

    try {
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        fromKeypair,
        mintPublicKey,
        fromKeypair.publicKey,
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        fromKeypair,
        mintPublicKey,
        destPublicKey,
      );

      const transaction = new SolanaTransaction().add(
        createTransferCheckedInstruction(
          fromTokenAccount.address,
          mintPublicKey,
          toTokenAccount.address,
          fromKeypair.publicKey,
          BigInt(amount),
          decimals,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );

      const txid = await this.connection.sendTransaction(transaction, [
        fromKeypair,
      ]);

      return { txid };
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  /**
   * Gets token balance
   * @param {string} mint
   * @returns {Promise<string|null>}
   */
  async getTokenBalance({ mint }) {
    try {
      const { value: splAccounts } =
        await this.connection.getParsedTokenAccountsByOwner(
          new PublicKey(this.wallet.address),
          {
            programId: new PublicKey(TOKEN_PROGRAM_ID),
          },
        );

      splAccounts.forEach((acc) => {
        if (
          acc.account.data.program === 'spl-token' &&
          acc.account.data.parsed.type === 'account'
        ) {
          const parsedInfo = acc.account.data.parsed.info;

          if (parsedInfo.mint === mint) {
            return parsedInfo.tokenAmount.amount;
          }
        }
        return null;
      });

      return null;
    } catch (error) {
      console.warn(error);
      return null;
    }
  }
}

export default SolanaTritonExplorer;

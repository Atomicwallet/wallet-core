import { WalletError } from 'src/errors';

import { Coin } from '../../abstract';
import AtomicExplorer from '../../explorers/collection/AtomicExplorer';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from '../../utils';
import { LIB_NAME_INDEX } from '../../utils/const';
import KomodoRewardCalculator from '../libs/KomodoRewardCalculator';
import { BitcoinLikeFeeMixin, BitgoMixin, HasProviders } from '../mixins';

const NAME = 'Komodo';
const TICKER = 'KMD';
const DERIVATION = "m/44'/141'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
const OVERWINTER_VERSION_GROUP_ID = '0x892F2085';
const MAX_EXPIRY_HEIGHT = 499999999;
const MS_IN_SECOND = 1000;
const REWARD_THRESHOLD = 1000000;
const ZCASH_SAPLING_VERSION = 4;
const { BITGO } = LIB_NAME_INDEX;

/**
 * Class
 *
 * @class KMDCoin
 */
class KMDCoin extends HasProviders(BitgoMixin(BitcoinLikeFeeMixin(Coin))) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const networks = {
      mainnet: {
        messagePrefix: '',
        bip32: {
          public: 0x0488b21e,
          private: 0x0488ade4,
        },
        pubKeyHash: 0x3c,
        scriptHash: 0x05,
        wif: 0xbc,
        coin: 'zec', // yec/zec compatible tx formats
        consensusBranchId: {
          1: 0x00,
          2: 0x00,
          3: 0x5ba81b19,
          4: 0x76b809bb,
        },
      },
    };

    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      socket,
      dependencies: {
        [BITGO]: new LazyLoadedLib(() =>
          import('bitgo-utxo-lib-legacy').then(({ default: bitgoLib }) => {
            // we can patch ZEC since this is bitgo-utxo-LEGACY and not used for actual ZEC sending
            bitgoLib.networks.zcash = networks.mainnet;
            return bitgoLib;
          }),
        ),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer, AtomicExplorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;

    this.transactions = [];

    this.balance = null;
    this.balances = null; // {?{ rewards: number }}
  }

  loadCoreLibrary() {
    return super.loadLib(BITGO);
  }

  async getNetwork() {
    const coreLibrary = await this.loadCoreLibrary();

    return coreLibrary.networks.zcash;
  }

  async getTransactionBuilder() {
    const coreLibrary = await this.loadCoreLibrary();

    const txBuilder = new coreLibrary.TransactionBuilder(await this.getNetwork());

    txBuilder.setVersion(ZCASH_SAPLING_VERSION);
    txBuilder.setLockTime(parseInt(Date.now() / MS_IN_SECOND, 10));
    txBuilder.setVersionGroupId(parseInt(OVERWINTER_VERSION_GROUP_ID, 16));
    txBuilder.setExpiryHeight(MAX_EXPIRY_HEIGHT);

    return txBuilder;
  }

  async signInput(txBuilder, keyForSign, index, input) {
    const coreLibrary = await this.loadCoreLibrary();

    return txBuilder.sign(index, keyForSign, null, coreLibrary.Transaction.SIGHASH_ALL, input.satoshis);
  }

  /**
   * calculate rewards
   * https://support.komodoplatform.com/support/solutions/articles/29000024428-komodo-5-active-user-reward-all-you-need-to-know
   * constant from
   * https://github.com/LedgerHQ/ledger-nano-s/issues/21
   *
   * get all utxo
   * filter only with value > 10
   * load info about inputs (locktime must be set and > 0)
   * calculate reward
   */
  async calculateReward(address) {
    const utxo = await this.getUnspentOutputs(address);
    const utxoDetail = await Promise.all(utxo.map(({ txid }) => this.getTransaction(txid)));
    const { blockHash = undefined } = await this.getProvider('utxo').getLatestBlock();
    const lastBlock = await this.getProvider('utxo').getBlock(blockHash);

    utxo.forEach((input) => {
      const detailed = utxoDetail.find((tx) => tx.txid === input.txid);

      input.locktime = detailed && detailed.locktime;
      input.tiptime = lastBlock.time;
      input.satoshis = Number(input.satoshis);
    });

    const { inputs, reward } = KomodoRewardCalculator(utxo);

    return {
      inputs,
      reward,
    };
  }

  /**
   * crate claim transaction
   *
   * @returns {Promise<void>}
   */
  async createClaimTransaction(rewardObject) {
    const { inputs = [], reward } = rewardObject || (await this.calculateReward(this.address));

    if (inputs.length === 0) {
      throw new Error('Claim is unavailable, please try again later.');
    }

    if (reward.toNumber() < REWARD_THRESHOLD) {
      throw new Error('Current reward is too low. Minimal amount is 0.01 KMD.');
    }

    const balance = inputs.reduce((acc, { value }) => acc.add(new this.BN(value)), new this.BN(0));

    const tx = await this.buildTx(
      inputs,
      this.address,
      balance.add(reward).toNumber(),
      new this.BN(0),
      this.#privateKey,
    );

    return tx;
  }

  async getInfo() {
    const { balance, balances } = await this.getProvider('balance').getInfo(this.address);

    this.balance = balance;

    if (balances) {
      this.balances = {
        rewards: balances.interest > 0 ? String(balances.interest) : '0',
      };
    } else {
      const { reward = undefined } = await this.calculateReward(this.address);

      let rewards = reward && this.toCurrencyUnit(reward);

      if (!rewards) {
        rewards = await this.getProvider('rewards')
          .getRewards(this.address)
          .catch((error) => console.warn(error));
      }

      this.balances = {
        rewards: String(rewards),
      };
    }

    return {
      balance: this.balance,
      balances: this.balances,
    };
  }

  async claim() {
    try {
      const tx = await this.createClaimTransaction();

      return await this.sendTransaction(tx);
    } catch (error) {
      throw new WalletError({
        type: 'claimError',
        error,
        instance: this,
      });
    }
  }

  setPrivateKey(privateKey) {
    super.setPrivateKey(privateKey);
    this.#privateKey = privateKey;
  }
}

export default KMDCoin;

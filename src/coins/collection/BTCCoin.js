import axios from 'axios';
import { Coin } from 'src/abstract';
import { BitcoinLikeFeeMixin, BitcoreMixin } from 'src/coins/mixins';
import { BlockbookV2Explorer } from 'src/explorers/collection';
import fees from 'src/resources/wallets_fee.json';
import { LazyLoadedLib } from 'src/utils';
import { LIB_NAME_INDEX } from 'src/utils/const';

const { BITCORE } = LIB_NAME_INDEX;
const NAME = 'Bitcoin';
const TICKER = 'BTC';
const DERIVATION = "m/44'/0'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * Class for bitcoin
 *
 * @class BTCCoin
 */
class BTCCoin extends BitcoreMixin(BitcoinLikeFeeMixin(Coin)) {
  #feeEstimateUrl;
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
        [BITCORE]: new LazyLoadedLib(() => import('bitcore-lib')),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;
    this.resendTimeout = feeData.resendTimeout;

    this.feeRecommended = null;
    this.networkName = 'mainnet';
  }

  setPrivateKey(privateKey) {
    super.setPrivateKey(privateKey);
    this.#privateKey = privateKey;
  }

  updateCoinParamsFromServer(data) {
    super.updateCoinParamsFromServer(data);
    this.#feeEstimateUrl = data.feesEstimateUrl;
    axios
      .get(this.#feeEstimateUrl)
      .then((res) => {
        if (res?.data?.fastestFee) {
          this.feePerByte = res.data.fastestFee;
          this.feeRecommended = res.data;
        }
      })
      .catch((error) => {
        console.warn('Bitcoinfees is unavailable', error);
      });
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount, memo, userFee }) {
    const bitcoreLib = await this.loadLib(BITCORE);

    const utxos = await this.getUnspentOutputs();

    const balanceBN = this.explorer.calculateBalance(utxos);
    const amountBN = new this.BN(String(amount));

    const fee = (userFee && new this.BN(userFee)) || (await this.getFee());

    const amountToSend = balanceBN.lt(amountBN.add(fee)) ? balanceBN.sub(fee) : amountBN;
    const unspend = balanceBN.sub(amountBN).sub(fee);

    const tx = new bitcoreLib.Transaction()
      .from(utxos)
      .to([{ address, satoshis: Number(amountToSend.toString()) }])
      .fee(Number(fee.toString()));

    if (unspend.gt(new this.BN(0))) {
      tx.to([{ address: utxos[0].address, satoshis: Number(unspend.toString()) }]);
    }

    tx.enableRBF();

    tx.sign(this.#privateKey.toString());

    return tx.serialize();
  }

  async getEstimatedTimeCfg(force = true) {
    try {
      if (this.feeRecommended === null || force) {
        const { feesEstimateUrl } = fees?.find(({ className }) => className === 'BTCCoin') || {};
        const { data } = await axios.get(feesEstimateUrl);

        this.feePerByte = data.fastestFee;
        this.feeRecommended = typeof data !== 'object' ? null : data;
      }
    } // @TODO implement logger
    }
    return this.feeRecommended;
  }

  async getEstimatedTimeTx(satPerByte, fieldName = 'label') {
    const MINUTE = 60000;
    const TIME_INTERVALS = {
      fastestFee: { time: MINUTE, label: '1-15 min' },
      halfHourFee: { time: 30 * MINUTE, label: '15-30 min' },
      hourFee: { time: 60 * MINUTE, label: '30-60 min' },
    };
    let timeName = null;

    try {
      const feeTimes = await this.getEstimatedTimeCfg();

      timeName = Object.keys(TIME_INTERVALS).find((tName) => satPerByte >= feeTimes?.[tName]);
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return TIME_INTERVALS[timeName || 'hourFee'][fieldName];
    }
  }

  async availableBalance(fee) {
    const maximumFee = (fee && new this.BN(fee)) || (await this.getFee());

    const availableBalance = new this.BN(this.balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));

    if (new this.BN(availableBalance).lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }

  async validateAddress(address) {
    const bitcoreLib = await this.loadLib(BITCORE);

    return bitcoreLib.Address.isValid(address || this.address, bitcoreLib.Networks.livenet.alias);
  }
}

export default BTCCoin;

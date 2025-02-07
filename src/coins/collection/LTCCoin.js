import { Coin } from 'src/abstract';
import BlockbookV2Explorer from 'src/explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from 'src/utils';

import { BitcoinLikeFeeMixin, BitcoreMixin } from '../mixins';

const NAME = 'Litecoin';
const TICKER = 'LTC';
const DERIVATION = "m/44'/60'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * Class for litecoin.
 *
 * @class LTCCoin
 */
class LTCCoin extends BitcoreMixin(BitcoinLikeFeeMixin(Coin)) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
    const networkName = 'litecoin-livenet';

    const addNetwork = (bitcoreLib) => {
      bitcoreLib.Networks.add({
        name: networkName,
        alias: networkName,
        pubkeyhash: 0x30,
        privatekey: 0xb0,
        scripthash: 0x32,
        xpubkey: 0x019da462,
        xprivkey: 0x019d9cfe,
        networkMagic: 0xfbc0b6db,
        port: 9333,
        dnsSeeds: [
          'dnsseed.litecointools.com',
          'dnsseed.litecoinpool.org',
          'dnsseed.ltc.xurious.com',
          'dnsseed.koin-project.com',
          'seed-a.litecoin.loshan.co.uk',
          'dnsseed.thrasher.io',
        ],
        bech32prefix: 'ltc',
      });
    };

    const bitcore = new LazyLoadedLib(() =>
      import('bitcore-lib').then(({ default: bitcoreLib }) => {
        addNetwork(bitcoreLib);
        return bitcoreLib;
      }),
    );

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
      dependencies: { bitcore },
    };

    super(config, db, configManager);

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.derivation = DERIVATION;

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;
    this.networkName = networkName;
  }

  async availableBalance(fee) {
    const maximumFee = (fee && new this.BN(fee)) || (await this.getFee());

    const availableBalance = new this.BN(this.balance).sub(maximumFee).sub(new this.BN(this.unspendableBalance));

    if (new this.BN(availableBalance).lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }

  setPrivateKey(privateKey) {
    super.setPrivateKey(privateKey);
    this.#privateKey = privateKey;
  }
}

export default LTCCoin;

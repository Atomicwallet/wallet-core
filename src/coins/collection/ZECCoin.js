import { Coin } from 'src/abstract';
import BlockbookV2Explorer from 'src/explorers/collection//BlockbookV2Explorer';
import { LazyLoadedLib } from 'src/utils';
import { LIB_NAME_INDEX } from 'src/utils';

import { BitcoinLikeFeeMixin, BitgoMixin } from '../mixins';

const NAME = 'ZCash';
const TICKER = 'ZEC';
const DERIVATION = "m/44'/133'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
const OVERWINTER_VERSION_GROUP_ID = '0x892F2085';
const MAX_EXPIRY_HEIGHT = 499999999;
const ZCASH_SAPLING_VERSION = 4;
const CONSENSUS_BRANCH_ID = 0xc2d6d0b4;
const { BITGO } = LIB_NAME_INDEX;

/**
 * Class
 *
 * @class ZECCoin
 */
class ZECCoin extends BitgoMixin(BitcoinLikeFeeMixin(Coin)) {
  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
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
          import('bitgo-utxo-lib').then(({ default: coreLibrary }) => {
            coreLibrary.networks.zcash.consensusBranchId[4] = CONSENSUS_BRANCH_ID;
            return coreLibrary;
          }),
        ),
      },
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;

    this.transactions = [];
  }

  loadCoreLibrary() {
    return super.loadLib(BITGO);
  }

  async getNetwork() {
    const coreLibrary = await this.loadCoreLibrary();

    return coreLibrary.networks.zcash;
  }

  async getBranchId() {
    const coreLibrary = await this.loadCoreLibrary();

    return coreLibrary.networks.zcash.consensusBranchId[4];
  }

  async setBranchId(id) {
    const coreLibrary = await this.loadCoreLibrary();

    coreLibrary.networks.zcash.consensusBranchId[4] = id;
  }

  async getTransactionBuilder() {
    const coreLibrary = await this.loadCoreLibrary();

    const txBuilder = new coreLibrary.TransactionBuilder(await this.getNetwork());

    txBuilder.setVersion(ZCASH_SAPLING_VERSION);
    txBuilder.setLockTime(0);
    txBuilder.setVersionGroupId(parseInt(OVERWINTER_VERSION_GROUP_ID, 16));
    txBuilder.setExpiryHeight(MAX_EXPIRY_HEIGHT);

    return txBuilder;
  }

  async signInput(txBuilder, keyForSign, index, input) {
    const coreLibrary = await this.loadCoreLibrary();

    return txBuilder.sign(
      index,
      keyForSign,
      null,
      coreLibrary.Transaction.SIGHASH_ALL,
      input.satoshis,
      undefined,
      true,
    );
  }

  updateCoinParamsFromServer(data) {
    super.updateCoinParamsFromServer(data);
    if (data.branchId) {
      this.branchId = data.branchId;
    }
  }
}

export default ZECCoin;

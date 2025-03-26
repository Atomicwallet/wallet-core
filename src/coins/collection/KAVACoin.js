import { Coin } from 'src/abstract';
import CosmosNodeExplorerV2 from 'src/explorers/collection/CosmosNodeExplorerV2';

import { CosmosMixinV2, HasBlockScanner, HasProviders } from '../mixins';

const NAME = 'Kava';
const TICKER = 'KAVA';
const DERIVATION = "m/44'/459'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';

const ADR_BECH32_PREFIX = 'kava';
const DENOM_NAME = 'ukava';
const SEND_GAS_AMOUNT = '250000';
const DELEGATE_GAS_AMOUNT = '300000';
const RE_DELEGATE_GAS_AMOUNT = '600000';
const CLAIM_REWARDS_GAS_AMOUNT = '600000';
const DEFAULT_RESERVE_FOR_STAKE = '10000';
const MIN_CLAIM_SUM = 0.01;

class KAVACoin extends CosmosMixinV2(HasBlockScanner(HasProviders(Coin))) {
  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
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
      feeData,
      denom: DENOM_NAME,
    };

    super(config, db, configManager);

    this.setExplorersModules([CosmosNodeExplorerV2]);

    this.loadExplorers(config);

    this.derivation = DERIVATION;

    this.prefix = ADR_BECH32_PREFIX;
    this.denom = DENOM_NAME;

    this.sendFeeGas = feeData.sendFeeGas?.toString() || SEND_GAS_AMOUNT;
    this.stakingFeeGas = feeData.stakingFeeGas?.toString() || DELEGATE_GAS_AMOUNT;
    this.claimFeeGas = feeData.claimFeeGas?.toString() || CLAIM_REWARDS_GAS_AMOUNT;
    this.reStakingFeeGas = feeData.reStakingFeeGas?.toString() || RE_DELEGATE_GAS_AMOUNT;
    this.transactions = [];
    this.minClaimSum = MIN_CLAIM_SUM;
    this.fields.paymentId = true;

    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (_, unconfirmedTx) => {
      this.onConfirmSocketTx(unconfirmedTx);
    });
    this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
  }

  getPredefineValidatorsConfigIdentifier() {
    return `${this.ticker}`;
  }
}

export default KAVACoin;

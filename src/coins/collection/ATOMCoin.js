import { Coin } from 'src/abstract';
import CosmosNodeExplorerV2 from 'src/explorers/collection/CosmosNodeExplorerV2';
import CosmosNodeWithBlockscannerExplorer from 'src/explorers/extended/CosmosNodeWithBlockscannerExplorer';

import { CosmosMixinV2, HasProviders } from '../mixins';

const NAME = 'Cosmos';
const TICKER = 'ATOM';
const DERIVATION = "m/44'/118'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';

const ADR_BECH32_PREFIX = 'cosmos';
const DENOM_NAME = 'uatom';
const SEND_GAS_AMOUNT = '200000';
const DELEGATE_GAS_AMOUNT = '300000';
const RE_DELEGATE_GAS_AMOUNT = '600000';
const CLAIM_REWARDS_GAS_AMOUNT = '600000';
const DEFAULT_RESERVE_FOR_STAKE = '10000';
const MIN_CLAIM_SUM = 0.01;

class ATOMCoin extends CosmosMixinV2(HasProviders(Coin)) {
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

    this.derivation = DERIVATION;

    this.setExplorersModules([CosmosNodeExplorerV2, CosmosNodeWithBlockscannerExplorer]);

    this.loadExplorers(config);

    this.prefix = ADR_BECH32_PREFIX;
    this.denom = DENOM_NAME;

    this.sendFeeGas = feeData.sendFeeGas?.toString() || SEND_GAS_AMOUNT;
    this.stakingFeeGas = feeData.stakingFeeGas?.toString() || DELEGATE_GAS_AMOUNT;
    this.claimFeeGas = feeData.claimFeeGas?.toString() || CLAIM_REWARDS_GAS_AMOUNT;
    this.reStakingFeeGas = feeData.reStakingFeeGas?.toString() || RE_DELEGATE_GAS_AMOUNT;
    this.transactions = [];
    this.minClaimSum = MIN_CLAIM_SUM;

    this.fields.paymentId = true;
    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx) => {
      this.getInfo();

      if (unconfirmedTx && unconfirmedTx.direction) {
        this.eventEmitter.emit('socket::newtx', {
          id: this.id,
          ticker: this.ticker,
          amount: unconfirmedTx.amount,
          txid: unconfirmedTx.txid,
        });
      } else {
        this.eventEmitter.emit('socket::newtx::outgoing', {
          id: this.id,
          ticker: this.ticker,
        });
      }
    });
    this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
  }

  getPredefineValidatorsConfigIdentifier() {
    return `${this.ticker}-2`;
  }
}

export default ATOMCoin;

import { Coin } from '../../abstract/index.js';
import CosmosNodeExplorerV2 from '../../explorers/collection/CosmosNodeExplorerV2.js';
import { CosmosMixinV2, HasBlockScanner, HasProviders } from '../mixins/index.js';
const NAME = 'Injective';
const TICKER = 'INJ';
const DERIVATION = "m/44'/60'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const ADR_BECH32_PREFIX = 'inj';
const DENOM_NAME = 'inj';
const SEND_GAS_AMOUNT = '200000';
const DELEGATE_GAS_AMOUNT = '300000';
const RE_DELEGATE_GAS_AMOUNT = '600000';
const CLAIM_REWARDS_GAS_AMOUNT = '600000';
const DEFAULT_RESERVE_FOR_STAKE = '10000';
const MIN_CLAIM_SUM = 0.01;
class INJCoin extends CosmosMixinV2(HasBlockScanner(HasProviders(Coin))) {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
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
            feeData,
            denom: DENOM_NAME,
        };
        super(config);
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
            this.getInfo();
            if (unconfirmedTx && unconfirmedTx.direction) {
                this.eventEmitter.emit('socket::newtx', {
                    id: this.id,
                    ticker: this.ticker,
                    amount: unconfirmedTx.amount,
                    txid: unconfirmedTx.txid,
                });
            }
            else {
                this.eventEmitter.emit('socket::newtx::outgoing', {
                    id: this.id,
                    ticker: this.ticker,
                });
            }
        });
        this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
    }
}
export default INJCoin;
//# sourceMappingURL=INJCoin.js.map
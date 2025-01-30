import { Coin } from '../../abstract/index.js';
import CosmosNodeExplorer from '../../explorers/collection/CosmosNodeExplorer.js';
import CosmosNodeExplorerV2 from '../../explorers/collection/CosmosNodeExplorerV2.js';
import { CosmosMixinV2, HasBlockScanner, HasProviders } from '../mixins/index.js';
const NAME = 'Band Protocol';
const TICKER = 'BAND';
const DERIVATION = "m/44'/494'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';
const ADR_BECH32_PREFIX = 'band';
const DENOM_NAME = 'uband';
const SEND_GAS_AMOUNT = '200000';
const DELEGATE_GAS_AMOUNT = '300000';
const RE_DELEGATE_GAS_AMOUNT = '600000';
const CLAIM_REWARDS_GAS_AMOUNT = '600000';
const DEFAULT_RESERVE_FOR_STAKE = '400';
class BANDCoin extends CosmosMixinV2(HasBlockScanner(HasProviders(Coin))) {
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
        this.derivation = DERIVATION;
        this.setExplorersModules([CosmosNodeExplorer, CosmosNodeExplorerV2]);
        this.loadExplorers(config);
        this.prefix = ADR_BECH32_PREFIX;
        this.denom = DENOM_NAME;
        this.sendFeeGas = feeData.sendFeeGas?.toString() || SEND_GAS_AMOUNT;
        this.stakingFeeGas = feeData.stakingFeeGas?.toString() || DELEGATE_GAS_AMOUNT;
        this.claimFeeGas = feeData.claimFeeGas?.toString() || CLAIM_REWARDS_GAS_AMOUNT;
        this.reStakingFeeGas = feeData.reStakingFeeGas?.toString() || RE_DELEGATE_GAS_AMOUNT;
        this.transactions = [];
        this.fields.paymentId = true;
        this.reserveForStake = feeData.reserveForStake || DEFAULT_RESERVE_FOR_STAKE;
    }
}
export default BANDCoin;
//# sourceMappingURL=BANDCoin.js.map
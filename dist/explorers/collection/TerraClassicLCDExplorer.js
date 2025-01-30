import { LCDClient } from '@terra-money/terra.js';
import Explorer from '../../explorers/explorer.js';
const BALANCES_BY_COINS = 0;
const FALLBACK_CHAIN_ID = 'columbus-5';
const FALLBACK_BASEURL = 'https://terra-classic-lcd.publicnode.com';
const FALLBACK_CACHE_TIME = 30000;
export default class TerraClassicLCDExplorer extends Explorer {
    constructor({ wallet, config }) {
        super(...arguments);
        this.lcdClient = new LCDClient({
            chainID: config.options?.chainID || FALLBACK_CHAIN_ID,
            URL: config.baseUrl || FALLBACK_BASEURL,
            isClassic: true,
        });
        this.cacheTime = Number(config.options?.cacheTime) || FALLBACK_CACHE_TIME;
        this.cache = {};
    }
    getAllowedTickers() {
        return ['LUNA', 'LUNC'];
    }
    getLcdWallet(privateKey) {
        return this.lcdClient.wallet(privateKey);
    }
    isCached(func) {
        return this.cache[func]?.time && new Date().getTime() - this.cache[func].time.getTime() < this.cacheTime;
    }
    putCache(key, value) {
        this.cache[key] = {
            value,
            time: new Date(),
        };
    }
    getCache(key) {
        return this.cache[key].value;
    }
    async getBalance(address, useSatoshis, denom = this.wallet.denom) {
        const key = 'getBalance';
        if (!this.isCached(key)) {
            this.putCache(key, this.lcdClient.bank.balance(address));
        }
        const balances = await this.getCache(key);
        const balancesByCoins = balances[BALANCES_BY_COINS];
        return balancesByCoins.get(denom)?.amount.toString() || '0';
    }
    async getTokenBalanceByContractAddress({ address, contractAddress }) {
        const tokenBalance = await this.lcdClient.wasm.contractQuery(contractAddress, {
            balance: {
                address,
            },
        });
        return tokenBalance.balance || '0';
    }
    async sendTransaction(tx) {
        return this.lcdClient.tx.broadcastSync(tx);
    }
    async getUserDenomList(address) {
        try {
            await this.getBalance(address);
            const balances = this.getCache('getBalance');
            const denoms = Object.keys(balances._coins);
            return denoms.map((denom) => ({
                symbol: this.wallet.getTickerFromDenom(denom),
                name: `Terra ${this.wallet.getTickerFromDenom(denom)}`,
                decimals: this.wallet.decimal,
                denom,
            }));
        }
        catch (error) {
            /**
             * If user hasn't luna or denoms and never had it
             * than this.lcdClient.bank.balance will throw an error,
             * that user does not exists. Actually everything is fine,
             * user just hasn't luna or denoms, and because of it function returns empty array.
             */
            return [];
        }
    }
    async estimateFee(signers, options) {
        return this.lcdClient.tx.estimateFee(signers, options);
    }
    async calculateTax(coin) {
        return this.lcdClient.utils.calculateTax(coin);
    }
    getAccountInfo(address) {
        return this.lcdClient.auth.accountInfo(address);
    }
    async getValidators(address) {
        return this.lcdClient.staking.bondedValidators(address);
    }
    async getStakingInfo(address) {
        const validators = await this.getValidators(address);
        return {
            validators,
        };
    }
    async getStakedDelegations(address) {
        const key = 'getStakedDelegations';
        if (!this.isCached(key)) {
            this.putCache(key, this.lcdClient.staking.delegations(address));
        }
        const [delegations] = await this.getCache(key);
        return delegations;
    }
    async getRewardsBalance(address) {
        const key = 'getRewardsBalance';
        if (!this.isCached(key)) {
            this.putCache(key, this.lcdClient.distribution.rewards(address));
        }
        return this.getCache(key);
    }
    async getUnbondingDelegations(address) {
        const key = 'getUnbondingDelegations';
        if (!this.isCached(key)) {
            this.putCache(key, this.lcdClient.staking.unbondingDelegations(address));
        }
        const [delegations] = await this.getCache(key);
        return delegations;
    }
}
//# sourceMappingURL=TerraClassicLCDExplorer.js.map
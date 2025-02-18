declare const StakableMaticETHToken_base: {
    new (): {
        [x: string]: any;
        createSmartContractCall({ type, smartContractAddress, standard, action, args }?: string): string;
        makeRawCall(abi: any, contract: string, method: string, args?: Array<any>): Promise<any>;
        getContractConstants(contract: string): Promise<{}>;
        decodeTransactionData(data: any): Promise<import("@ethersproject/abi").TransactionDescription>;
        estimateDataGas({ contract, data, amount }: {
            contract: any;
            data: any;
            amount?: string | undefined;
        }): Promise<string>;
        getAllowance({ contract, spender, abi }: string): any;
        makeApproval({ contract, address, amount }: string): string;
        createApproveTransaction({ contract, address, amount, userGasPrice, gasLimit, multiplier, nonce }?: {}): any;
    };
    [x: string]: any;
};
export default class StakableMaticETHToken extends StakableMaticETHToken_base {
    constructor({ config, ...args }: {
        [x: string]: any;
        config: any;
    }, db: any, configManager: any);
    stakingContract: any;
    stakingGasLimit: any;
    unstakingGasLimit: any;
    restakeRewardsGasLimit: any;
    claimRewardsGasLimit: any;
    withdrawGasLimit: any;
    approvalGasLimit: any;
    getInfo(): Promise<{
        balance: any;
        balances: any;
    }>;
    calculateTotal({ balance, staked, unstaking, rewards }: {
        balance: any;
        staked: any;
        unstaking: any;
        rewards: any;
    }): Amount;
    calculateAvailableForStake({ balance, availableVotes }: {
        balance: any;
        availableVotes: any;
    }): Promise<Amount>;
    /**
     * Accumulate validators field value
     * @param { object } validators
     * @param { string } ieldName
     * @return { Amount }
     */
    accumulateValidatorsValues(validators: object, fieldName: any): Amount;
    /**
     * Cumulative staked amount
     * @param { object }validators
     * @return {Amount}
     */
    calculateStaked(validators: object): Amount;
    /**
     * Cumulative staked amount
     * @param { object }validators
     * @return {Amount}
     */
    calculateUnstaking(validators: object): Amount;
    /**
     * Cumulative rewards amount
     * @param { object }validators
     * @return { Amount }
     */
    calculateRewards(validators: object): Amount;
    /**
     * Cumulative rewards amount
     * @param { object }validators
     * @return { Amount }
     */
    calculatePendingWithdrawals(validators: object): Amount;
    /**
     * Cumulative rewards amount
     * @param { object }validators
     * @return { Amount }
     */
    calculateAvailableWithdrawals(validators: object): Amount;
    fetchStakingInfo(): Promise<{
        balance: Amount;
        staked: Amount;
        unstaking: Amount;
        availableVotes: Amount;
        pendingWithdrawals: Amount;
        availableWithdrawals: Amount;
        rewards: Amount;
        validators: {
            [k: string]: any;
        };
    }>;
    /**
     * Add amount of tokens to current approved amount which can be spent by `address`
     * @param address
     * @param amount'
     * @return {string}
     */
    increaseAllowance({ address, amount }: {
        address: any;
        amount: any;
    }): string;
    createApproveTransaction({ nonce, userGasPrice, gasLimit, multiplier }?: {
        gasLimit?: any;
    }): any;
    createDelegationTransaction({ amount, validator, nonce, userGasPrice, gasLimit, multiplier }: {
        amount: any;
        validator: any;
        nonce: any;
        userGasPrice: any;
        gasLimit?: any;
        multiplier: any;
    }): any;
    createUnstakeTransaction({ amount, validator, nonce, userGasPrice, gasLimit, multiplier }: {
        amount: any;
        validator: any;
        nonce: any;
        userGasPrice: any;
        gasLimit?: any;
        multiplier: any;
    }): any;
    createWithdrawTransaction({ validator, nonce, userGasPrice, gasLimit, multiplier }: {
        validator: any;
        nonce: any;
        userGasPrice: any;
        gasLimit?: any;
        multiplier: any;
    }): Promise<any>;
    createClaimRewardsTransaction({ validator, nonce, userGasPrice, gasLimit, multiplier }: {
        validator: any;
        nonce: any;
        userGasPrice: any;
        gasLimit?: any;
        multiplier: any;
    }): any;
    createRestakeRewardsTransaction({ validator, nonce, userGasPrice, gasLimit, multiplier, }: {
        validator: any;
        nonce: any;
        userGasPrice: any;
        gasLimit?: any;
        multiplier: any;
    }): any;
    getPredefineValidatorsConfigIdentifier(): string;
}
import { Amount } from '../utils/index.js';
export {};

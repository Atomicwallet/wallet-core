export default Web3Mixin;
declare function Web3Mixin(superclass: any): {
    new (): {
        [x: string]: any;
        /**
         * Creates payload data to call specific method on given smart contract
         * returned data should be inserted in transaction data before signing
         *
         * @param {string} type token type
         * @param {string} smartContractAddress
         * @param {string} action Methods name
         * @param {string[]} args specific args
         * @return {string}
         */
        createSmartContractCall({ type, smartContractAddress, standard, action, args }?: string): string;
        /**
         * Call a smartcontract
         * @param { JSON-ABI } abi
         * @param { string } contract
         * @param { string } method
         * @param { Array<*> } args
         * @return { Promise<*> }
         */
        makeRawCall(abi: any, contract: string, method: string, args?: Array<any>): Promise<any>;
        /**
         * Retrieve contract constant values
         * @param {string} contract address
         * @return {Promise<{}>}
         */
        getContractConstants(contract: string): Promise<{}>;
        decodeTransactionData(data: any): Promise<ethers.utils.TransactionDescription>;
        /**
         * Estimates gasLimit for contract calls
         * @param contract contract address
         * @param data call data
         * @param amount optional
         * @return {Promise<string>}
         */
        estimateDataGas({ contract, data, amount }: {
            contract: any;
            data: any;
            amount?: string | undefined;
        }): Promise<string>;
        /**
         * Get contract allowance for spender address
         * @param { string } contract Contract address
         * @param { string } spender Spender address
         * @param { JSON } abi Contact ABI
         * @return {any}
         */
        getAllowance({ contract, spender, abi }: string): any;
        /**
         * Approves amount of tokens to be spent by `address`
         * @param {string} contract contract address
         * @param { string } address spender address
         * @param { string } amount
         * @return { string } data
         */
        makeApproval({ contract, address, amount }: string): string;
        /**
         * Creates `approve` transaction
         * @param contract SmartContract address
         * @param address Spender address to approve
         * @param amount Amount to approve
         * @param userGasPrice
         * @param gasLimit
         * @param multiplier
         * @param nonce
         * @return {any}
         */
        createApproveTransaction({ contract, address, amount, userGasPrice, gasLimit, multiplier, nonce }?: {}): any;
    };
    [x: string]: any;
};
import { ethers } from 'ethers';

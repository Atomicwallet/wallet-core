import { ethers } from 'ethers';
import * as ABICollection from 'src/tokens/ABI';
import ERC20Default from 'src/tokens/ABI/ERC-20/standard';

const DEFAULT_MAX_GAS = '250000';
const MAX_ALLOWED_AMOUNT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

const Web3Mixin = (superclass) =>
  class extends superclass {
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
    createSmartContractCall({ type = 'ERC20', smartContractAddress, standard = false, action, args = [] } = {}) {
      if (!type) {
        throw new Error(`One of supported 'type' should be defined: [${Object.keys(ABICollection).toString()}`);
      }

      if (!smartContractAddress) {
        throw new Error('argument `smartContractAddress` should be defined!');
      }

      const supportedSmartContract =
        ABICollection[type.toUpperCase()]?.[standard ? 'standard' : smartContractAddress.toLowerCase()];

      if (!supportedSmartContract) {
        throw new Error(`Smart-contract ${type.toUpperCase()} ${smartContractAddress} is not supported`);
      }

      const { name, params } = supportedSmartContract.methods[action] || {};

      if (!name) {
        throw new Error(
          `Smart-contract action '${action}' is not supported, supported actions:
          [${Object.keys(supportedSmartContract.methods).toString()}]`,
        );
      }

      if (params?.length > args.length) {
        throw new Error(`Smart-contract parameters should include ${params.length} values, got ${args.length}`);
      }

      const ABI = supportedSmartContract.abi;

      if (!ABI) {
        throw new Error(`No such ${type} ABI found for ${smartContractAddress}`);
      }

      const contractInterface = new this.coreLibrary.eth.Contract(ABI, smartContractAddress, args);

      if (typeof contractInterface.methods[name] !== 'function') {
        throw new TypeError(
          `${this.constructor.name}: "${name}" is not implemented in provided smart-contract ABI methods`,
        );
      }

      return contractInterface.methods[name](...args).encodeABI();
    }

    /**
     * Call a smartcontract
     * @param { JSON-ABI } abi
     * @param { string } contract
     * @param { string } method
     * @param { Array<*> } args
     * @return { Promise<*> }
     */
    makeRawCall(abi, contract, method, args = []) {
      const contractInterface = new this.coreLibrary.eth.Contract(abi, contract);

      return contractInterface.methods[method](...args).call();
    }

    /**
     * Retrieve contract constant values
     * @param {string} contract address
     * @return {Promise<{}>}
     */
    async getContractConstants(contract) {
      const contractInterface = new this.coreLibrary.eth.Contract(ERC20Default, contract);
      const batch = new this.coreLibrary.BatchRequest();

      const constants = ERC20Default.filter(
        ({ constant, type, inputs }) => constant && type === 'function' && inputs.length === 0,
      );

      const info = {};
      const promises = [];

      for (let index = 0; index < constants.length; index += 1) {
        const method = constants[index].name;

        const promise = new Promise((resolve, reject) => {
          const callback = (err, result) => {
            if (err) {
              console.warn(`Web3Mixin: Failed to call method '${method}'`, err);
              reject(err);
            }

            info[method] = result;
            resolve(result);
          };

          batch.add(contractInterface.methods[method]().call.request(callback));
        });

        promises.push(promise);
      }

      await batch.execute();

      await Promise.allSettled(promises);

      return info;
    }

    async decodeTransactionData(data) {
      const erc20interface = new ethers.utils.Interface(ERC20Default);

      const parsed = erc20interface.parseTransaction({ data });

      return parsed;
    }

    /**
     * Estimates gasLimit for contract calls
     * @param contract contract address
     * @param data call data
     * @param amount optional
     * @return {Promise<string>}
     */
    async estimateDataGas({ contract, data, amount = '0x0' }) {
      const estimateGas = await this.coreLibrary.eth
        .estimateGas({
          from: this.address,
          to: contract,
          nonce: Number(this.nonce.add(new this.BN(1))),
          value: amount,
          data,
        })
        .catch((error) => {
          console.error(`${this.ticker}: Failed to estimate gas, used default max 250k`, error);
        });

      return estimateGas ? Math.ceil(estimateGas * (this.gasLimitCoefficient ?? 1)).toString() : DEFAULT_MAX_GAS;
    }

    /**
     * Get contract allowance for spender address
     * @param { string } contract Contract address
     * @param { string } spender Spender address
     * @param { JSON } abi Contact ABI
     * @return {any}
     */
    getAllowance({ contract, spender, abi = ERC20Default }) {
      const contractInterface = new this.coreLibrary.eth.Contract(abi, contract);

      return contractInterface.methods.allowance([this.address, spender]).call();
    }

    /**
     * Approves amount of tokens to be spent by `address`
     * @param {string} contract contract address
     * @param { string } address spender address
     * @param { string } amount
     * @return { string } data
     */
    makeApproval({ contract, address, amount }) {
      const data = this.createSmartContractCall({
        smartContractAddress: contract,
        standard: true,
        action: 'approve',
        args: [address, amount],
      });

      return data;
    }

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
    createApproveTransaction({ contract, address, amount, userGasPrice, gasLimit, multiplier, nonce } = {}) {
      const paymentData = this.makeApproval({
        contract,
        address,
        amount: amount ?? MAX_ALLOWED_AMOUNT,
      });

      return this.createTransaction({
        address: contract,
        amount: '0',
        paymentData,
        nonce: nonce ?? this.nonce,
        userGasPrice,
        gasLimit,
        multiplier,
      });
    }
  };

export default Web3Mixin;

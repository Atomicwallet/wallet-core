import { logger } from 'src/utils';
export const NODE_PROVIDER_OPERATION = 'node';
export const BALANCE_PROVIDER_OPERATION = 'balance';
export const HISTORY_PROVIDER_OPERATION = 'history';
export const TOKEN_PROVIDER_OPERATION = 'token';
export const TOKEN_HISTORY_PROVIDER_OPERATION = 'token-history';
export const SEND_PROVIDER_OPERATION = 'send';
export const NFT_SEND_PROVIDER_OPERATION = 'nft-send';
export const SOCKET_PROVIDER_OPERATION = 'socket';
// @TODO Use more standard names for that things - may be load-lib
export const TONWEB_PROVIDER_OPERATION = 'tonweb';
const HasProviders = (superclass) =>
  class extends superclass {
    processExplorerConfig(config) {
      const explorer = super.processExplorerConfig(config);

      if (!explorer || !Array.isArray(config.usedFor)) {
        return explorer;
      }

      // associate the explorer with a provider name
      if (config.usedFor.length === 0) {
        this.defaultProvider = explorer;
      } else {
        if (!this.providersMap) {
          this.providersMap = {};
        }
        config.usedFor.forEach((name) => {
          this.providersMap[name] = explorer;
        });
      }
      return explorer;
    }

    getProvider(name) {
      return this.providersMap?.[name] ?? this.defaultProvider ?? this.explorer;
    }

    async getBalance() {
      return this.getProvider('balance').getBalance(this.address, true);
    }

    async getTransactions(args) {
      try {
        if (!this.address) {
          throw new Error(`[${this.ticker}] getTransactions error: address is not loaded`);
        }

        return this.getProvider('history').getTransactions({
          ...args[0],
          address: this.address,
        });
      } catch (error) {
        console.error(error);
        return this.transactions || [];
      }
    }

    /**
     * Gets the information about a wallet.
     *
     * @return {Promise<Object>} The information data.
     */
    async getInfo() {
      const balance = await this.getBalance();

      this.balance = balance;

      return {
        balance,
      };
    }

    async getUnspentOutputs(address = this.address, scriptPubKey) {
      if (!scriptPubKey && typeof this.getScriptPubKey === 'function') {
        scriptPubKey = await this.getScriptPubKey();
      }

      return this.getProvider('utxo').getUnspentOutputs(address, scriptPubKey);
    }

    getUTXO() {
      return this.getProvider('utxo').getUnspentOutputs(this.address);
    }

    sendTransaction(rawtx) {
      return this.getProvider('send').sendTransaction(rawtx);
    }

    getTransaction(txid) {
      return this.getProvider('tx').getTransaction(this.address, txid);
    }

    /**
     * Update dynamic data set
     *
     * @param {Object} config Server coin data
     */
    updateCoinParamsFromServer(config) {
      super.updateCoinParamsFromServer(config);

      if (config.chainID) {
        this.chainId = config.chainID;
      }

      try {
        if (config.feeData) {
          this.fee = config.feeData.fee;

          if (config.feeData.stakingContract) {
            this.stakingContract = config.feeData.stakingContract;
          }

          if (config.feeData.stakingProxyContract) {
            this.stakingProxyContract = config.feeData.stakingProxyContract;
          }

          if (config.feeData.stakingFeeGas) {
            this.stakingFeeGas = config.feeData.stakingFeeGas.toString();
          }

          if (config.feeData.reStakingFeeGas) {
            this.reStakingFeeGas = config.feeData.reStakingFeeGas;
          }

          if (config.feeData.unstakingFeeGas) {
            this.unstakingFeeGas = config.feeData.unstakingFeeGas.toString();
          }

          if (config.feeData.claimFeeGas) {
            this.claimFeeGas = config.feeData.claimFeeGas.toString();
          }

          if (config.feeData.tokenFeeGas) {
            this.tokenFeeGas = config.feeData.tokenFeeGas;
          }

          if (config.feeData.sendFeeGas) {
            this.sendFeeGas = config.feeData.sendFeeGas;
          }

          // Ethereum specific
          if (config.feeData.defaultGasPrice) {
            this.sendFeeGas = config.feeData.defaultGasPrice;
          }

          if (config.feeData.gasPriceCoefficient) {
            this.sendFeeGas = config.feeData.gasPriceCoefficient;
          }

          if (config.feeData.defaultMaxGasPrice) {
            this.sendFeeGas = config.feeData.defaultMaxGasPrice;
          }

          if (config.feeData.gasLimitCoefficient) {
            this.sendFeeGas = config.feeData.gasLimitCoefficient;
          }

          if (config.feeData.gasLimit) {
            this.sendFeeGas = config.feeData.gasLimit;
          }

          if (config.feeData.resendTimeout) {
            this.sendFeeGas = config.feeData.resendTimeout;
          }
        }

        return true;
      } catch (error) {
        error.message = `[${this.ticker}] updateCoinParamsFromServer error: ${error.message || 'Unknown error'}`;
        logger.log({ instance: this, error });

        return false;
      }
    }
  };

export default HasProviders;

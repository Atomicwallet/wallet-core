
import Explorer from 'src/explorers/explorer';

const COSMOS_MSG_TYPES = {
  MsgWithdrawDelegationReward: 'reward',
  MsgDelegate: 'stake',
  MsgUndelegate: 'unstake',
  MsgSend: 'transfer',
};

export default class TerraClassicFCDExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.network = 'classic';
  }

  getAllowedTickers() {
    return ['LUNC'];
  }

  getTransactionsUrl() {
    return '/v1/txs';
  }

  getTransactionsParams(address, offset, limit) {
    return { account: address, offset, limit };
  }

  modifyLatestBlockResponse(response) {
    return response.height;
  }

  getLatestBlockUrl() {
    return '/oracle/denoms/actives';
  }

  getGasPrices() {
    return this.request('/v1/txs/gas_prices', 'GET');
  }

  getCosmosTxType(tx) {}

  getTxType(tx) {
    const messages = Array.isArray(tx.tx?.value?.msg) ? tx.tx?.value?.msg : [];
    const txType = messages.map(({ type: nativeType }) => nativeType.split('/').pop())[0];

    if (COSMOS_MSG_TYPES[txType] === undefined) {
      throw new Error(`[LUNC] txType ${txType} not found`);
    }

    return COSMOS_MSG_TYPES[txType];
  }

  getTxDenom(tx) {
    return tx.tx.value.msg[0].value;
  }

  getTxCoins(selfAddress, tx) {
    const type = this.getTxType(tx);

    if (type === 'reward') {
      const rewardReceived = tx.logs.reduce((sum, current) => {
        const coinReceived = current.events?.find((e) => {
          return (
            e.type === 'coin_received' &&
            e.attributes.find(({ key, value }) => key === 'receiver' && value === selfAddress)
          );
        });

        if (coinReceived) {
          const amounts = coinReceived.attributes?.find(({ key }) => key === 'amount')?.value;

          if (amounts) {
            const res = /(\d*)uluna/.exec(amounts);

            if (res !== null) {
              sum += BigInt(res[1]);
            }
          }
        }

        return sum;
      }, 0n);

      return { denom: 'uluna', amount: rewardReceived.toString() };
    }

    let coins = tx.tx?.value?.msg[0]?.value?.amount;

    if (Array.isArray(coins)) {
      coins = coins.find(({ denom }) => ['uluna', 'uusd'].includes(denom));
    }

    return coins;
  }

  getTxAssetId(asset) {
    if (asset === this.wallet.ticker) {
      return this.wallet.id;
    }

    const walletTokens = this.wallet.tokens();

    const assetInstance = Object.keys(walletTokens).find((token) => walletTokens[token]?.ticker === asset);

    if (!assetInstance) {
      return null;
    }

    return walletTokens[assetInstance].id;
  }

  getTxDirection(selfAddress, tx) {
    const type = this.getTxType(tx);

    switch (type) {
      case 'stake':
        return false;
      case 'unstake':
        return true;
      case 'reward':
        return true;

      default: {
        // should be transfer
        const { to_address: toAddress } = tx.tx.value.msg[0].value;

        return toAddress === selfAddress;
      }
    }
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const type = this.getTxType(tx);

    const { validator_address: validator, from_address: from, to_address: to } = tx.tx.value.msg[0].value;

    switch (type) {
      case 'stake':
      case 'unstake':
      case 'reward':
        return validator;

      default: // should be transfer
        return this.getTxDirection(selfAddress, tx) ? from : to;
    }
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx.tx.value.fee.amount[0]?.amount);
  }

  getTickerFromDenom(denom) {
    if (!denom) {
      return '';
    }

    if (denom === 'uluna') {
      return 'LUNC';
    }

    if (denom === 'uusd') {
      return 'USTC';
    }

    return denom;
  }

  async modifyTransactionsResponse({ txs }, selfAddress) {
    if (!Array.isArray(txs)) {
      return [];
    }

    let latestBlock;

    try {
      latestBlock = await this.getLatestBlock();
    } catch (error) {
      // @TODO implement logger
      console.warn('[TerraClassicFCDExplorer] modifyTransactionsResponse error: Could not get latest block');
      return null;
    }

    return txs
      .map((tx) => {
        const txValue = this.getTxCoins(selfAddress, tx);

        const ticker = this.getTickerFromDenom(txValue.denom);

        if (!ticker) {
          return [];
        }

        const walletid = this.getTxAssetId(ticker);

        if (!walletid) {
          return [];
        }

        try {
          const convertedTx = {
            ticker,
            name: this.wallet.name,
            walletid,
            txType: this.getTxType(tx),
            txid: tx.txhash,
            direction: this.getTxDirection(selfAddress, tx),
            otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
            amount: this.wallet.toCurrencyUnit(txValue.amount),
            datetime: new Date(tx.timestamp),
            memo: tx.tx.value.memo,
            alias: this.wallet.alias,
            fee: this.getTxFee(tx),
            feeTicker: this.wallet.ticker,
            confirmations: latestBlock ? latestBlock - tx.height : 1,
          };

          return convertedTx;
        } catch (error) {
          // @TODO implement logger
          console.warn('[TerraClassicFCDExplorer] modifyTransactionsResponse error: Could not parse tx:', tx);
          return null;
        }
      })
      .filter((tx) => tx);
  }
}

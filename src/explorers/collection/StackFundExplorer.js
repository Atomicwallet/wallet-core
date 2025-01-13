import Explorer from 'src/explorers/explorer';

class StackFundExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.defaultTxLimit = 7;
  }

  getAllowedTickers() {
    return ['ATOM'];
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}/tx/${txId}`;
  }

  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}/address/${address}`;
  }

  getTransactionsParams(address, offset = 0) {
    return {
      page: offset > this.defaultTxLimit ? parseInt(offset / this.defaultTxLimit, 10) : 1,
    };
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(
      response.txs.filter(({ msg }) => {
        try {
          const [{ type }] = JSON.parse(Buffer.from(msg, 'base64').toString('ascii'));

          return !!type;
        } catch (error) {
          return false;
        }
      }),
      address,
    );
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDateTime(tx) {
    return new Date(tx.time);
  }

  getTxDirection(selfAddress, tx) {
    try {
      const [txParams] = JSON.parse(Buffer.from(tx.msg, 'base64').toString('ascii'));

      if (txParams.type !== 'cosmos-sdk/MsgSend') {
        return false;
      }

      return selfAddress === txParams.value.to_address;
    } catch (error) {
      return undefined;
    }
  }

  getTxOtherSideAddress(selfAddress, tx) {
    try {
      const [txParams] = JSON.parse(Buffer.from(tx.msg, 'base64').toString('ascii'));

      if (txParams.type !== 'cosmos-sdk/MsgSend') {
        return txParams.value.validator_address;
      }

      return this.getTxDirection(selfAddress, tx) ? txParams.value.from_address : txParams.value.to_address;
    } catch (error) {
      // @TODO implement logger

      return 'Parse Error';
    }
  }

  getTxValue(selfAddress, tx) {
    try {
      const [txParams] = JSON.parse(Buffer.from(tx.msg, 'base64').toString('ascii'));
      const [fee] = JSON.parse(Buffer.from(tx.fees, 'base64').toString('ascii'));

      let amount = '0'; // withdraw tx has no amount in txParams

      if (txParams.value.amount) {
        // msgSend has `amount` as Array of amounts
        // msgDelegate has `amount` as Object

        amount = Array.isArray(txParams.value.amount) ? txParams.value.amount[0].amount : txParams.value.amount.amount;
      }

      return Number(
        this.wallet.toCurrencyUnit(
          this.getTxDirection(selfAddress, tx)
            ? amount
            : new this.wallet.BN(amount).add(new this.wallet.BN(fee.amount)),
        ),
      );
    } catch (error) {
      return 0;
    }
  }

  getTxMemo(tx) {
    return tx.memo;
  }

  getTxConfirmations(tx) {
    return 1;
  }
}

export default StackFundExplorer;

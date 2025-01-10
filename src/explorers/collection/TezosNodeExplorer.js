import Explorer from '../Explorer';

class TezosNodeExplorer extends Explorer {
  getAllowedTickers() {
    return ['XTZ'];
  }

  getInfoUrl(address) {
    return `${this.config.baseUrl}/chains/main/blocks/head/context/contracts/${address}/balance`;
  }

  getDelegate(address) {
    return this.request(
      `${this.config.baseUrl}/chains/main/blocks/head/context/contracts/${address}/delegate`,
    );
  }

  /**
   * Tezos node explore has no native fetch operation by hash query
   * so we used this for socket only, which returns complete suited operation as { hash: tx<{}>}
   * @param selfAddress
   * @param tx Operation object
   * @returns {{}}
   */
  getTransaction(selfAddress, tx) {
    return super.modifyTransactionResponse(tx, selfAddress);
  }

  async isValidator(address) {
    const response = await this.request(
      `${this.config.baseUrl}/chains/main/blocks/head/context/delegates/${address}`,
    ).catch((error) => console.warn(error));

    return !!response;
  }

  modifyInfoResponse(response) {
    return { balance: response };
  }

  getTxDirection(selfAddress, tx) {
    return tx.contents[0].destination === selfAddress;
  }

  getTxConfirmations(tx) {
    return 1;
  }

  getTxDateTime(tx) {
    return new Date();
  }

  getTxValue(address, tx) {
    return this.wallet.toCurrencyUnit(tx.contents[0].amount);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx)
      ? tx.contents[0].source
      : tx.contents[0].destination;
  }
}

export default TezosNodeExplorer;

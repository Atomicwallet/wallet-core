import { StacksMainnet } from '@stacks/network';

import Explorer from '../Explorer';

export default class StacksExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    const config = args[0];

    this.network = new StacksMainnet({
      url: config.baseUrl,
    });
  }

  async getInfo(address) {
    const accountInfoUrl = this.network.getAccountApiUrl(address);
    const res = await fetch(accountInfoUrl);
    const result = await res.json();

    return { balance: Number(result.balance), nonce: result.nonce };
  }

  async getTransactions({ address }) {
    const res = await fetch(`${this.config.baseUrl}/extended/v1/address/${address}/transactions`);
    const result = await res.json();

    return this.modifyTransactionsResponse(
      result.results.filter((tx) => tx.tx_type === 'token_transfer'),
      address,
    );
  }

  getNetwork() {
    return this.network;
  }

  getTxHash(tx) {
    return tx.tx_id;
  }

  getTxDirection(selfAddress, tx) {
    return tx.token_transfer.recipient_address === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.sender_address : tx.token_transfer.recipient_address;
  }

  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(tx.token_transfer.amount);
  }

  getTxDateTime(tx) {
    return new Date(tx.burn_block_time_iso);
  }

  getTxConfirmations(tx) {
    return tx.is_unachored ? 0 : 1;
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx.fee_rate);
  }

  getTxNonce(tx) {
    return tx.nonce;
  }
}

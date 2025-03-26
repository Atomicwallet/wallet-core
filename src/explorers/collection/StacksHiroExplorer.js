import Explorer from 'src/explorers/explorer';

export default class StacksHiroExplorer extends Explorer {
  async getInfo(address) {
    const balances = await this.request(`${this.config.baseUrl}/extended/v1/address/${address}/stx`);

    return { balance: Number(balances.balance) };
  }

  async getPossibleNextNonce(address) {
    const nonces = await this.request(`${this.config.baseUrl}/extended/v1/address/${address}/nonces`);

    return nonces.possible_next_nonce;
  }
}

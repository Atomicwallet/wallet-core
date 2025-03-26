import Explorer from 'src/explorers/explorer';

class NeoNodeExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    const { wallet, config } = args[0];

    this.nodeClientPromise = wallet.coreLib.api.NetworkFacade.fromConfig({
      node: config.baseUrl,
    });
  }

  getAllowedTickers() {
    return ['NEO', 'GAS'];
  }

  async sendTransaction({ tx, signingConfig }) {
    const client = await this.getClient();

    return client.transferToken([tx], signingConfig);
  }

  async getFeeInformation(api) {
    const client = await this.getClient();

    return api.getFeeInformation(client);
  }

  async sendRawTransaction(tx) {
    const client = await this.getClient();

    return client.sendRawTransaction(tx);
  }

  async getClient() {
    return (await this.nodeClientPromise).client;
  }
}

export default NeoNodeExplorer;

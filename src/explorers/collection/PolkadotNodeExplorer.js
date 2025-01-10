import { ExplorerRequestError } from 'src/errors';
import Explorer from 'src/explorers/explorer';
import { LazyLoadedLib } from 'src/utils';
import { SEND_TRANSACTION_TYPE } from 'src/utils/const';

const polkaDotApi = new LazyLoadedLib(() => import('@polkadot/api'));

class PolkadotNodeExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.endpoint = null;
  }

  async loadEndpoint() {
    if (!this.endpoint) {
      const WsProvider = await polkaDotApi.get('WsProvider');

      const wsProvider = new WsProvider(this.config.baseUrl);

      const ApiPromise = await polkaDotApi.get('ApiPromise');

      this.endpoint = await ApiPromise.create({ provider: wsProvider });
    }

    return true;
  }

  getAllowedTickers() {
    return ['DOT'];
  }

  async getInfo(address) {
    if (!address) {
      return {};
    }

    await this.loadEndpoint();

    // const response = await this.endpoint.query.system.account(address)
    const { nonce, data: balance } = await this.endpoint.query.system.account(address);

    return {
      balance: balance.free.sub(balance.miscFrozen).toString(),
      balances: {
        available: balance.free.sub(balance.miscFrozen).toString(),
        free: balance.free.toString(),
        frozen: balance.miscFrozen.toString(),
      },
      transactions: this.wallet.transactions,
      nonce: nonce.toString(),
    };
  }

  async sendTransaction({ rawtx, privateKey }) {
    await this.loadEndpoint();

    const tx = await this.endpoint.rpc.author.submitExtrinsic(rawtx);

    return {
      txid: tx.toHex(),
    };

    /* TODO hint: commented block below is still good workaround to build and sign transaction with immediate send
         but at this moment build signed tx implemented in DOTCoin instance for another `submit` explorers usage
         wich takes only signed tx hex as submittable
     */

    // const transfer = this.endpoint.tx.balances.transfer(rawtx.address, rawtx.amount)
    // const keyring = new Keyring({ type: 'sr25519' })
    // const seed = Buffer.from(privateKey, 'hex')
    // const keyPair = keyring.addFromSeed(seed)
    //
    // try {
    //   const hash = await transfer.signAndSend(keyPair)
    //
    //   return {
    //     txid: hash.toString('hex'),
    //   }
    // } catch (error) {
    //   throw new ExplorerRequestError({
    //     type: SEND_TRANSACTION_TYPE,
    //     error: new Error(error.message),
    //     instance: this,
    //   })
    // }
  }

  async sendDelegationTransaction({ rawtx, privateKey }) {
    await this.loadEndpoint();

    const Keyring = await polkaDotApi.get('Keyring');

    const keyring = new Keyring({ type: 'sr25519' });
    const seed = Buffer.from(privateKey, 'hex');
    const keyPair = keyring.addFromSeed(seed);

    const bondTransaction = this.endpoint.tx.staking.bond(
      keyPair.publicKey,
      Number(rawtx.amount),
      rawtx.rewardDestination,
    );

    try {
      return new Promise((resolve) => {
        bondTransaction.signAndSend(keyPair, async ({ events = [], status }) => {
          if (status.isInBlock) {
            try {
              const nominateTransaction = this.endpoint.tx.staking.nominate(rawtx.validatorAddresses);
              const hash = await nominateTransaction.signAndSend(keyPair);

              return resolve({
                txid: hash.toString('hex'),
              });
            } catch (error) {
              throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error: new Error(error.message),
                instance: this,
              });
            }
          }
        });
      });
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(error.message),
        instance: this,
      });
    }
  }

  async sendUnDelegationTransaction({ rawtx, privateKey }) {
    await this.loadEndpoint();

    const Keyring = await polkaDotApi.get('Keyring');

    const keyring = new Keyring({ type: 'sr25519' });
    const seed = Buffer.from(privateKey, 'hex');
    const keyPair = keyring.addFromSeed(seed);

    try {
      const unBondTransaction = this.endpoint.tx.staking.unbond(Number(rawtx.amount));
      const hash = await unBondTransaction.signAndSend(keyPair);

      return {
        txid: hash.toString('hex'),
      };
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(error.message),
        instance: this,
      });
    }
  }
}

export default PolkadotNodeExplorer;

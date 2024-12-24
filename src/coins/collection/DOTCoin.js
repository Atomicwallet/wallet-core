import { Coin } from '../../abstract';
import { LazyLoadedLib } from '../../utils';
import { WalletError } from '../../errors';
import { SEND_TRANSACTION_TYPE } from '../../utils/const';
import PolkadotSidecarExplorer from '../../explorers/collection/PolkadotSidecarExplorer';
import PolkaScanExplorer from '../../explorers/collection/PolkaScanExplorer';
import PolkadotNodeExplorer from '../../explorers/collection/PolkadotNodeExplorer';
import { HasBlockScanner, HasProviders } from '../mixins';

const NAME = 'Polkadot';
const TICKER = 'DOT';
const DERIVATION = "m/44'/354'/0'/0/0";
const DECIMAL = 10;
const UNSPENDABLE_BALANCE = '10000000000';

const POLKADOT_ADDRESS_TYPE = 0; // 0 - Mainnet, 42 - WESTEND https://github.com/paritytech/substrate/wiki/External-Address-Format-(SS58)
const KEY_LENGTH = 32;
const REWARD_DESTINATION = 'Stash'; // https://wiki.polkadot.network/docs/en/maintain-guides-how-to-nominate-polkadot#step-2-bond-your-dot

const polkadotTypesExtrinsicLib = new LazyLoadedLib(
  () => import('@polkadot/types/extrinsic/v4/Extrinsic'),
);
const substrateTxWrapperPolkadotLib = new LazyLoadedLib(
  () => import('@substrate/txwrapper-polkadot'),
);
const polkadotUtilsLib = new LazyLoadedLib(() => import('@polkadot/util'));
const UniqueNftLib = new LazyLoadedLib(() => import('@unique-nft/sr25519'));

class DOTCoin extends HasProviders(HasBlockScanner(Coin)) {
  #privateKey;

  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      feeData,
      socket,
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([
      PolkadotSidecarExplorer,
      PolkaScanExplorer,
      PolkadotNodeExplorer,
    ]);

    this.loadExplorers(config);

    this.fee = feeData.fee;
    this.nonce = 0;
    this.transactions = [];
  }

  async loadWallet(seed, phrase) {
    const { Sr25519Account } = await UniqueNftLib.get();
    const secret = seed.slice(0, KEY_LENGTH);
    const acc = Sr25519Account.other.fromMiniSecret(secret);

    this.#privateKey = secret.toString('hex');
    this.address = acc.prefixedAddress(POLKADOT_ADDRESS_TYPE);

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    const { Sr25519Account } = await UniqueNftLib.get();

    try {
      const encoded = await Sr25519Account.utils.encodeSubstrateAddress(
        Sr25519Account.utils.decodeSubstrateAddress(address),
        POLKADOT_ADDRESS_TYPE,
      );

      return encoded === address;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }

  async getInfo() {
    const {
      balance = undefined,
      balances = {},
      nonce = undefined,
    } = await this.getProvider('balance').getInfo(this.address);

    if (balance) {
      this.balance = balance;
    }

    if (nonce) {
      this.nonce = nonce;
    }

    if (balances && Object.keys(balances).length > 0) {
      this.balances = balances;
    }

    return { balance, balances: this.balances };
  }

  async createTransaction({ address, amount }) {
    if (!address || !address.length === 0) {
      throw new WalletError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error('Destination address must be specified'),
        instance: this,
      });
    }

    const [
      { number, hash },
      { genesisHash, specVersion, txVersion, specName, chainName },
      metadata,
      { EXTRINSIC_VERSION },
      { getRegistry, construct, methods: substrateMethods },
    ] = await Promise.all([
      this.getProvider('meta').getLatestBlock(),
      this.getProvider('meta').getTxMeta(),
      this.getProvider('meta').getMetadata(),
      polkadotTypesExtrinsicLib.get(),
      substrateTxWrapperPolkadotLib.get(),
    ]);

    const registry = getRegistry({
      chainName,
      specName,
      specVersion,
      metadataRpc: metadata,
    });

    const baseTxInfo = {
      address: this.address,
      blockHash: hash,
      blockNumber: registry.createType('BlockNumber', number).toNumber(),
      genesisHash,
      nonce: this.nonce,
      tip: 0,
      eraPeriod: 64,
      specVersion,
      transactionVersion: txVersion,
      metadataRpc: metadata,
    };

    const unsignedTx = substrateMethods.balances.transferKeepAlive(
      { dest: address, value: amount },
      baseTxInfo,
      { metadataRpc: metadata, registry },
    );

    const signingPayload = construct.signingPayload(unsignedTx, { registry });

    const { Sr25519Account } = await UniqueNftLib.get();

    const acc = Sr25519Account.other.fromMiniSecret(
      Buffer.from(this.#privateKey, 'hex'),
    );

    const { u8aConcat } = await polkadotUtilsLib.get();

    const { signature } = registry
      .createType('ExtrinsicPayload', signingPayload, {
        version: EXTRINSIC_VERSION,
      })
      .sign({
        sign: (message) => {
          return u8aConcat(new Uint8Array([1]), acc.sign(message));
        },
      });

    return construct.signedTx(unsignedTx, signature, {
      metadataRpc: metadata,
      registry,
    });
  }

  async sendTransaction(rawtx) {
    return this.getProvider('send').sendTransaction({
      rawtx,
      privateKey: this.#privateKey,
    });
  }

  async createDelegationTransaction(validator, amount) {
    const rawtx = {
      address: this.address,
      amount,
      validatorAddresses: [validator],
      rewardDestination: REWARD_DESTINATION,
    };

    return this.getProvider('send').sendDelegationTransaction({
      rawtx,
      privateKey: this.#privateKey,
    });
  }

  async createUnDelegationTransaction(amount) {
    const rawtx = {
      amount,
    };

    return this.getProvider('send').sendUnDelegationTransaction({
      rawtx,
      privateKey: this.#privateKey,
    });
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default DOTCoin;

import { ExplorerRequestError, WalletError } from 'src/errors';

import {
  LazyLoadedLib,
  SEND_TRANSACTION_TYPE,
  WALLET_ERROR,
} from '../../utils';

const CONFIRM_TIMEOUT = 5000;
const CONFIRM_RETRIES = 5;
const GAS_DECIMALS = 8;
const MIRGARION_ADDRESS = 'ANeo2toNeo3MigrationAddressxwPB2Hz';
const FREE_SWAP_THRESHOLD = 10;

const bitcoinJsLib = new LazyLoadedLib(() => import('bitcoinjs-lib-secp256r1'));

const NeoMixin = (superclass) =>
  class extends superclass {
    #privateKey;
    /**
     * Loads a wallet.
     *
     * @param {String} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    async loadWallet(seed, mnemonic) {
      const bitcoin = await bitcoinJsLib.get();
      const root = bitcoin.HDNode.fromSeedBuffer(seed, bitcoin.bitcoin);
      const node = root.derivePath(this.derivation);

      const { keyPair } = node.derive(0);

      if (!keyPair) {
        throw new WalletError({
          type: WALLET_ERROR,
          error: new Error("can't derive private key"),
          instance: this,
        });
      }

      await this.setPrivateKey(keyPair.toWIF());

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    }

    /**
     * The address getter
     *
     * @return {String}
     */
    getAddress() {
      if (this.account) {
        return this.account.address;
      }
      return new WalletError({
        type: WALLET_ERROR,
        error: new Error('this.account is empty'),
        instance: this,
      });
    }

    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
      if (!address) {
        return false;
      }

      const firstLetter = this.id === 'NEO3' ? 'N' : 'A';

      const coreLib = await this.loadLib('coreLib');

      return address[0] === firstLetter && coreLib.wallet.isAddress(address);
    }

    /**
     * @param address
     * @param amount
     * @returns {Promise<string>}
     */
    async createTransaction({ address, amount, asset }) {
      if (!asset) {
        asset = this.ticker;
      }
      if (asset.toUpperCase() === 'GAS') {
        amount = this.toCurrencyUnit(amount, GAS_DECIMALS);
      }

      const coreLib = await this.loadLib('coreLib');
      const intent = await coreLib.api.makeIntent(
        {
          [asset.toUpperCase()]: amount,
        },
        address,
      );

      return JSON.stringify(intent);
    }

    /**
     * @param rawTx
     * @returns {Promise<{txid}>}
     */
    async sendTransaction(rawTx) {
      const coreLib = await this.loadLib('coreLib');

      const apiProvider = new coreLib.api.neoscan.instance('MainNet');
      const intent = JSON.parse(rawTx);

      try {
        const {
          response: { result, txid: hash },
        } = await coreLib.default.sendAsset({
          api: apiProvider, // The network to perform the action, MainNet or TestNet.
          account: this.account, // This is the address which the assets come from.
          intents: intent, // This is where you want to send assets to.
        });

        if (!result) {
          throw new ExplorerRequestError({
            type: SEND_TRANSACTION_TYPE,
            error: new Error('sendTransaction return false'),
            instance: this,
          });
        }

        return {
          txid: hash,
        };
      } catch (error) {
        throw new ExplorerRequestError({
          type: SEND_TRANSACTION_TYPE,
          error,
          instance: this,
        });
      }
    }

    async getInfo() {
      const { balance, balances } = await this.explorer.getInfo(this.address);

      this.balance = balance;
      this.balances = balances;

      return {
        balance,
        balances,
      };
    }

    async sendAllToMyself() {
      let amountToSend;
      let asset;

      if (this.balances.neo > 0) {
        asset = 'neo';
        amountToSend = this.balances.neo;
      } else if (this.balances.gas > 0) {
        asset = 'gas';
        amountToSend = this.toMinimalUnit(this.balances.gas, GAS_DECIMALS);
      }

      const tx = await this.createTransaction({
        address: this.address,
        amount: amountToSend,
        asset,
      });

      return this.sendTransaction(tx);
    }

    /**
     * Claim gas
     * @returns {Promise<void>}
     */
    async claim() {
      try {
        if (!this.#privateKey) {
          throw new Error(`[${this.ticker}] claim: no private key`);
        }

        await this.getInfo(this.address);

        await this.sendAllToMyself();

        await new Promise((resolve, reject) =>
          setTimeout(resolve, CONFIRM_TIMEOUT),
        );
        const coreLib = await this.loadLib('coreLib');

        const apiProvider = new coreLib.api.neoscan.instance('MainNet');

        const claimed = await coreLib.default.claimGas({
          api: apiProvider,
          account: this.account,
        });

        return {
          txid: claimed.response.txid,
        };
      } catch (error) {
        throw new ExplorerRequestError({
          type: SEND_TRANSACTION_TYPE,
          error,
          instance: this,
        });
      }
    }

    async waitUntilConfirmed(txid) {
      let confirmed = false;
      let tries = 0;

      do {
        try {
          await new Promise((resolve, reject) =>
            setTimeout(resolve, CONFIRM_TIMEOUT),
          );
          await this.getTransaction(txid);
          confirmed = true;
        } catch (error) {
          if (tries >= CONFIRM_RETRIES) {
            console.error(
              `[${this.ticker}] waitUntilConfirmed: max tries count reached`,
            );
            throw error;
          }
        }

        tries++;
      } while (tries < CONFIRM_RETRIES && !confirmed);
    }

    async swap({ amount, asset = this.ticker }) {
      const coreLib = await this.loadLib('coreLib');
      const { api, tx } = coreLib; // "@cityofzion/neon-js": "^4.9.0"
      const { wallet: wallet3 } = this.coreLib3;

      const account = this.account;
      const intents = api.makeIntent(
        {
          [asset]: amount,
        },
        MIRGARION_ADDRESS,
      );
      const apiProvider = new coreLib.api.neoscan.instance('MainNet');

      const balance = await apiProvider.getBalance(account.address);

      const config = {
        url: apiProvider, // TODO
        account,
        balance,
        intents,
        fees: amount > FREE_SWAP_THRESHOLD ? 0 : 1,
        signingCallback: api.signWithPrivateKey(this.#privateKey),
      };

      const raw = await api.createContractTx(config);

      const account3 = new wallet3.Account(this.#privateKey);

      raw.tx.addAttribute(
        tx.TxAttrUsage.Remark14,
        Buffer.from(account3.address).toString('hex'),
      );

      await api.signTx(raw);

      const result = await api.sendTx(config);

      return {
        txid: result.response.txid,
      };
    }

    /**
     * Sets the private key.
     *
     * @param {String} privateKey The private key WIF
     */
    async setPrivateKey(privateKey) {
      const coreLib = await this.loadLib('coreLib');

      this.#privateKey = privateKey;
      this.account = new coreLib.wallet.Account(privateKey);
      this.address = this.account.address;
    }
  };

export default NeoMixin;

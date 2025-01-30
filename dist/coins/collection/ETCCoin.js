import { Coin } from '../../abstract/index.js';
import { ExplorerRequestError } from '../../errors/index.js';
import BlockscoutExplorer from '../../explorers/collection/BlockscoutExplorer.js';
import Web3Explorer from '../../explorers/collection/Web3Explorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { SEND_TRANSACTION_TYPE } from '../../utils/const/index.js';
const Web3LazyLoaded = new LazyLoadedLib(() => import('web3'));
const hdkeyLazyLoaded = new LazyLoadedLib(() => import('ethereumjs-wallet'));
const DECIMAL = 18;
const FEE = '42000';
const TICKER = 'ETC';
const ETC_CHAIN_ID = 61;
const UNSPENDABLE_BALANCE = '0';
const NAME = 'Ethereum Classic';
const DERIVATION = "m/44'/0'/0'/0/0";
/**
 * @class ETCCoin
 */
class ETCCoin extends Coin {
    #privateKey;
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
            socket,
        };
        super(config);
        this.setExplorersModules([BlockscoutExplorer, Web3Explorer]);
        this.loadExplorers(config);
        this.derivation = DERIVATION;
        this.gasLimit = feeData.gasLimit;
        this.coefficient = feeData.coefficient;
        const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');
        this.web3BaseUrl = web3Params.baseUrl;
        const blockscoutParams = explorers.find(({ className }) => className === 'BlockscoutExplorer');
        this.blockscout = new BlockscoutExplorer({
            wallet: this.instance,
            config: blockscoutParams,
        });
    }
    /**
     * Sets web3 instance
     * @returns {Promise<void>}
     */
    async setWeb3() {
        const { default: Web3 } = await Web3LazyLoaded.get();
        this.web3 = new Web3(this.web3BaseUrl);
    }
    /**
     * Gets web3 instance
     * @returns {Promise<*>}
     */
    async getWeb3() {
        if (!this.web3) {
            await this.setWeb3();
        }
        return this.web3;
    }
    /**
     * Gets the address.
     *
     * @return {String|Error} The address or error.
     */
    async getAddress() {
        return this.#privateKey
            ? (await this.getWeb3()).eth.accounts.privateKeyToAccount(this.#privateKey).address
            : new Error('ETC: Coin could not get privateKey');
    }
    /**
     * Loads a wallet.
     *
     * @param {Seed} seed The seed
     * @return {Promise}
     */
    async loadWallet(seed) {
        const [web3, { hdkey }] = await Promise.all([this.getWeb3(), hdkeyLazyLoaded.get()]);
        const ethHDKey = hdkey.fromMasterSeed(seed);
        const wallet = ethHDKey.getWallet();
        const account = await web3.eth.accounts.privateKeyToAccount(wallet.getPrivateKeyString());
        if (!account) {
            throw new Error('ETC: Coin could not load wallet');
        }
        this.#privateKey = account.privateKey;
        this.address = account.address;
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    /**
     * Validates the address.
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
        const web3 = await this.getWeb3();
        return web3.utils.isAddress(address);
    }
    /**
     * Gets the fee.
     *
     * @param  {Number}  amount In satoshis
     * @param  {Boolean} isSendAll The is send all (default: false)
     * @return {Promise<BN>} The fee.
     */
    async getFee() {
        const gasPrice = await this.getGasPrice();
        return new this.BN(this.coefficient).mul(new this.BN(this.gasLimit).mul(new this.BN(gasPrice)));
    }
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentData The payment id (only HEX value!)
     * @param {String} gas
     * @return {Promise<String>} Raw transaction
     */
    async createTransaction({ address, amount, paymentData, gas = FEE }) {
        const gasPrice = await this.getGasPrice();
        const transaction = {
            to: address,
            value: amount,
            gas,
            chainId: ETC_CHAIN_ID,
            gasPrice,
        };
        if (paymentData) {
            transaction.data = paymentData;
        }
        const web3 = await this.getWeb3();
        const signedTx = await web3.eth.accounts.signTransaction(transaction, this.#privateKey);
        return signedTx.rawTransaction;
    }
    /**
     * Update dynamic data set
     *
     * @param {Object} data The data
     */
    async updateCoinParamsFromServer(data) {
        super.updateCoinParamsFromServer(data);
        const web3Params = data.explorers.find(({ className }) => className === 'Web3Explorer');
        const web3 = await this.getWeb3();
        if (web3.currentProvider.host !== web3Params.baseUrl) {
            this.web3BaseUrl = web3Params.baseUrl;
            await this.setWeb3();
        }
        const blockscoutParams = data.explorers.find(({ className }) => className === 'BlockscoutExplorer');
        if (blockscoutParams && this.blockscout.config.baseUrl !== blockscoutParams.baseUrl) {
            this.blockscout = new BlockscoutExplorer({
                wallet: this.instance,
                config: blockscoutParams,
            });
        }
    }
    async getInfo() {
        const web3 = await this.getWeb3();
        const balance = await web3.eth.getBalance(this.address);
        this.balance = balance;
        return { balance };
    }
    async getTransactions(...args) {
        return this.blockscout.getTransactions(...args);
    }
    async getGasPrice() {
        const web3 = await this.getWeb3();
        const gasPrice = await web3.eth.getGasPrice();
        return new this.BN(gasPrice);
    }
    async sendTransaction(rawtx) {
        return new Promise(async (resolve, reject) => {
            const web3 = await this.getWeb3();
            web3.eth
                .sendSignedTransaction(rawtx)
                .on('transactionHash', (hash) => {
                resolve({ txid: hash });
            })
                .catch((error) => {
                const modifiedError = new ExplorerRequestError({
                    type: SEND_TRANSACTION_TYPE,
                    error,
                    instance: this,
                });
                reject(modifiedError);
            });
        });
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
}
export default ETCCoin;
//# sourceMappingURL=ETCCoin.js.map
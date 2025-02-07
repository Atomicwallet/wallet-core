import { Coin } from '../../abstract/index.js';
import XlmExplorer from '../../explorers/collection/XlmExplorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
const stellarSdkLib = new LazyLoadedLib(() => import('stellar-sdk'));
const stellarHdWalletLib = new LazyLoadedLib(() => import('stellar-hd-wallet'));
const NAME = 'Stellar';
const TICKER = 'XLM';
const DERIVATION = "m/44'/148'/0'";
const DECIMAL = 7;
const UNSPENDABLE_BALANCE = '10000000';
/**
 * Class for Stellar.
 *
 * @class XLMCoin
 */
class XLMCoin extends Coin {
    #privateKey;
    /**
     * constructs the object.
     *
     * @param  {<type>} alias the alias
     * @param  {<type>} feeData the fee data
     * @param  {array}  explorers the explorers
     * @param  {<type>} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
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
        super(config, db, configManager);
        this.derivation = DERIVATION;
        this.setExplorersModules([XlmExplorer]);
        this.loadExplorers(config);
        this.fee = feeData.fee;
        this.fields.paymentId = true;
    }
    /**
     * Loads a wallet.
     *
     * @param {BitcoreMnemonic} mnemonic The private key object.
     * @return {Promise<Object>} The private key.
     */
    loadWallet(seed) {
        return new Promise(async (resolve) => {
            const { default: StellarHDWallet } = await stellarHdWalletLib.get();
            const walletObj = StellarHDWallet.fromSeed(seed);
            walletObj.derive(DERIVATION);
            const walletKeyPair = walletObj.getKeypair(0);
            this.#privateKey = walletKeyPair.secret();
            this.address = walletKeyPair.publicKey();
            resolve({
                id: this.id,
                privateKey: this.#privateKey,
                address: this.address,
            });
        });
    }
    /**
     * Gets the transaction info.
     *
     * @param {String} txId The transaction identifier.
     * @return {Promise<Object>} The transaction.
     */
    async getTransaction(txId) {
        const txFilteredArray = this.transactions.filter((tx) => tx.txid === txId);
        return txFilteredArray.length > 0 ? txFilteredArray[0] : {};
    }
    /**
     * The address getter
     *
     * @return {String} { description_of_the_return_value }
     */
    getAddress() {
        return this.address;
    }
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
        try {
            const { default: StellarSdk } = await stellarSdkLib.get();
            return StellarSdk.StrKey.isValidEd25519PublicKey(address);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} paymentId The payment id (only int!)
     * @return {Object} Raw transaction
     */
    async createTransaction({ address, amount, memo }) {
        return { address, amount, paymentId: memo };
    }
    async sendTransaction(rawtx) {
        return this.explorer && this.explorer.sendTransaction(rawtx, this.address, this.#privateKey, this.fee);
    }
    /**
     * @param {Number} amount In satoshis
     * @param isSendAll
     * @return {Promise<BN>}
     */
    async getFee({ amount = null, isSendAll = false } = {}) {
        if (!amount && !isSendAll) {
            return super.getFee({ amount, isSendAll });
        }
        const fee = await this.explorer.getFee();
        return fee;
    }
    /**
     * Update dynamic data set
     *
     * @param {Object} data The data
     */
    updateCoinParamsFromServer(data) {
        super.updateCoinParamsFromServer(data);
        const xlmExplorerParams = data.explorers.find(({ className }) => className === 'XlmExplorer');
        this.explorers[0].fee = this.fee;
        this.explorers[0].baseUrl = xlmExplorerParams.baseUrl;
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
}
export default XLMCoin;
//# sourceMappingURL=XLMCoin.js.map
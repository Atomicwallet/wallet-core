import Coin from '../../abstract/coin.js';
import { WalletError } from '../../errors/index.js';
import { AlgoExplorer, AlgoNodeExplorer } from '../../explorers/collection/index.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { WALLET_ERROR } from '../../utils/const/index.js';
import { HasProviders } from '../mixins/index.js';
const algosdkLazyLoaded = new LazyLoadedLib(() => import('algosdk'));
const NAME = 'Algorand';
const TICKER = 'ALGO';
const DERIVATION = "m/44'/283'/0'/0/0"; // not used for with coin
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '100000';
const GENESIS_HASH = 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=';
const GENESIS_ID = 'mainnet-v1.0';
const THOUSAND = 1000;
const LAST_ROUND = 'last-round';
class ALGOCoin extends HasProviders(Coin) {
    #privateKey;
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
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
        this.setExplorersModules([AlgoExplorer, AlgoNodeExplorer]);
        this.loadExplorers(config);
        this.derivation = DERIVATION;
        this.fee = feeData.fee;
        this.transactions = [];
    }
    /**
     * Loads wallet from seed
     * @param  {} seed
     */
    async loadWallet(seed) {
        const algosdk = await algosdkLazyLoaded.get();
        const agloMnemonic = algosdk.secretKeyToMnemonic(seed);
        const account = algosdk.mnemonicToSecretKey(agloMnemonic);
        if (!account) {
            throw new WalletError({
                type: WALLET_ERROR,
                error: new Error("can't get a privateKey!"),
                instance: this,
            });
        }
        this.#privateKey = Buffer.from(account.sk).toString('hex');
        this.address = account.addr;
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    async getInfo() {
        const { balance = null } = await this.getProvider('balance').getInfo(this.address);
        this.balance = balance;
        return {
            balance,
        };
    }
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    async getAddress() {
        if (this.#privateKey) {
            const seed = new Uint8Array(Buffer.from(this.#privateKey, 'hex'));
            const algosdk = await algosdkLazyLoaded.get();
            const agloMnemonic = algosdk.secretKeyToMnemonic(seed);
            const account = algosdk.mnemonicToSecretKey(agloMnemonic);
            return account.addr;
        }
        throw new WalletError({
            type: WALLET_ERROR,
            error: new Error('privateKey is empty!'),
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
        const algosdk = await algosdkLazyLoaded.get();
        return algosdk.isValidAddress(address);
    }
    getLatestBlock() {
        return this.getProvider('send').getLatestBlock();
    }
    async createTransaction({ address, amount }) {
        const lastBlockInfo = await this.getLatestBlock();
        const signedTxn = await this.signTransaction({
            from: this.address,
            to: address,
            fee: Number(this.fee),
            amount: Number(amount),
            firstRound: lastBlockInfo[LAST_ROUND],
            lastRound: lastBlockInfo[LAST_ROUND] + THOUSAND,
            note: new Uint8Array(0),
            genesisID: GENESIS_ID,
            genesisHash: GENESIS_HASH,
            flatFee: true,
        });
        return signedTxn.blob;
    }
    async signTransaction(txn) {
        const seed = new Uint8Array(Buffer.from(this.#privateKey, 'hex'));
        const algosdk = await algosdkLazyLoaded.get();
        return algosdk.signTransaction(txn, seed);
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
}
export default ALGOCoin;
//# sourceMappingURL=ALGOCoin.js.map
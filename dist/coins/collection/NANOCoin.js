import { Coin } from '../../abstract/index.js';
import { WalletError } from '../../errors/index.js';
import NanonodeExplorer from '../../explorers/collection/NanonodeExplorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { WALLET_ERROR } from '../../utils/const/index.js';
import { HasProviders } from '../mixins/index.js';
const blakeLazyLoaded = new LazyLoadedLib(() => import('blakejs'));
const bip39LazyLoaded = new LazyLoadedLib(() => import('bip39'));
const nanoNodeNaclLazyLoaded = new LazyLoadedLib(() => import('nano-node/nacl'));
const nanoNodeFunctionsLazyLoaded = new LazyLoadedLib(() => import('nano-node/functions'));
const nanoAddressValidatorLazyLoaded = new LazyLoadedLib(() => import('nano-address-validator'));
const NAME = 'Nano';
const TICKER = 'NANO';
const DERIVATION = "m/44'/165'/0'/0/0";
const DECIMAL = 30; // !!!!!!!!
const UNSPENDABLE_BALANCE = '0';
const STATE_BLOCK_PREAMBLE = '0000000000000000000000000000000000000000000000000000000000000006';
const FRONTIER = '0000000000000000000000000000000000000000000000000000000000000000';
const DEFAULT_REPRESENTATIVE = 'nano_35btiz1mgfwp95c3ckazmzbp5gepduxtijuijd9xebeau8u1gsbea41smjca';
const PENDING_CONFIRMATION_TIMEOUT = 5000;
const BLOCK_HASH_LENGTH = 64;
const ERR_ACC_NOT_FOUND = 'Account not found';
const ACC_EMPTY_STATE = {
    frontier: FRONTIER,
    representative: DEFAULT_REPRESENTATIVE,
};
/**
 * @class NANOCoin
 */
class NANOCoin extends HasProviders(Coin) {
    #privateKey;
    /**
     * Constructs the object.
     *
     * @param {string} alias the alias
     * @param {object} feeData the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {string} txWebUrl the transmit web url
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
        this.setExplorersModules([NanonodeExplorer]);
        this.loadExplorers(config);
        this.fee = feeData.fee;
        this.transactions = [];
        this.eventEmitter.on(`${this.id}-${this.id}::mine-txs`, () => {
            this.confirmAllPendingBlocks();
        });
        this.eventEmitter.on(`${this.id}-${this.id}::new-socket-tx`, () => this.getInfo());
        this.account_state = {};
    }
    connectSocket() {
        this.getProvider('socket').connectSocket(this.address);
    }
    async getPublicKeyHexAndAccountKeyPair(accountBytes) {
        const accountKeyPair = await this.generateAccountKeyPair(accountBytes);
        const publicKeyHex = Buffer.from(accountKeyPair.publicKey).toString('hex');
        return { accountKeyPair, publicKeyHex };
    }
    /**
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {string} phrase The mnemonic string
     * @return {Promise<{id: string, privateKey: string, address: string}>} The private key.
     */
    async loadWallet(seed, phrase) {
        try {
            const [{ default: bip39 }, { accountFromKey }] = await Promise.all([
                bip39LazyLoaded.get(),
                nanoNodeFunctionsLazyLoaded.get(),
            ]);
            const seedHex = bip39.mnemonicToEntropy(phrase);
            const accountIndex = 0;
            const seedBytes = this.hexToUint8(seedHex);
            const accountBytes = await this.generateAccountSecretKeyBytes(seedBytes, accountIndex);
            const { accountKeyPair, publicKeyHex } = await this.getPublicKeyHexAndAccountKeyPair(accountBytes);
            // change old format prefix xrb > new prefix nano
            this.address = accountFromKey(publicKeyHex).replace('xrb', 'nano');
            this.#privateKey = Buffer.from(accountKeyPair.secretKey).toString('hex');
            return {
                id: this.id,
                privateKey: this.#privateKey,
                address: this.address,
            };
        }
        catch (error) {
            throw new WalletError({
                type: WALLET_ERROR,
                error,
                instance: this,
            });
        }
    }
    /**
     * Return address
     *
     * @returns {Promise<{string}>}
     */
    async getAddress() {
        if (this.#privateKey) {
            const accountBytes = this.hexToUint8(this.#privateKey);
            const [{ publicKeyHex }, { accountFromKey }] = await Promise.all([
                this.getPublicKeyHexAndAccountKeyPair(accountBytes),
                nanoNodeFunctionsLazyLoaded.get(),
            ]);
            return accountFromKey(publicKeyHex).replace('xrb', 'nano');
        }
        return new WalletError({
            type: WALLET_ERROR,
            error: new Error('privateKey is empty!'),
            instance: this,
        });
    }
    /**
     * Validates wallet address
     *
     * @param {string} address The address
     * @return {Promise<{boolean}>}
     */
    async validateAddress(address) {
        const { default: isValid } = await nanoAddressValidatorLazyLoaded.get();
        return isValid(address);
    }
    /**
     * Creates a transaction.
     *
     * @param {string} address The destination address
     * @param {number} amount The amount to send
     * @return {Promise<string>} Raw transaction
     */
    async createTransaction({ address, amount }) {
        await this.getInfo();
        const [work, link] = await Promise.all([
            this.getWork(this.account_state.frontier),
            this.getAccountPublicKey(address),
        ]);
        const remainingBalance = new this.BN(this.balance).sub(new this.BN(amount));
        const payload = this.hexToUint8(link);
        const signature = await this.signSendBlock(payload, remainingBalance);
        const transaction = {
            type: 'state',
            account: this.address,
            previous: this.account_state.frontier,
            representative: this.account_state.representative,
            balance: remainingBalance.toString(),
            link,
            work,
            signature,
        };
        return { block: transaction, subtype: 'send' };
    }
    /**
     * Create receive transaction
     *
     * @param {string} receiveBlockHash
     * @returns {Promise<string>}
     */
    async createReceiveTransaction(receiveBlockHash) {
        let isFirstReceiveTx = true;
        try {
            await this.getInfo();
            isFirstReceiveTx = false;
        }
        catch (error) {
            console.warn('NANO: getInfo throws an error, probably trying to receive first tx for a given acc');
        }
        const [blockInfo, publicKey] = await Promise.all([
            this.getProvider('tx').getBlockInfo(receiveBlockHash),
            this.getAccountPublicKey(this.address),
        ]);
        const getWorkFor = isFirstReceiveTx ? publicKey : this.account_state.frontier;
        const work = await this.getWork(getWorkFor);
        if (!work) {
            throw new WalletError({
                type: WALLET_ERROR,
                error: new Error(`[NANO] could not get work for ${getWorkFor}`),
                instance: this,
            });
        }
        const remainingBalance = isFirstReceiveTx
            ? new this.BN(blockInfo.amount)
            : new this.BN(this.balance).add(new this.BN(blockInfo.amount));
        const payload = this.hexToUint8(receiveBlockHash);
        const signature = await this.signSendBlock(payload, remainingBalance);
        const transaction = {
            type: 'state',
            account: this.address,
            previous: this.account_state.frontier,
            representative: this.account_state.representative,
            balance: remainingBalance.toString(),
            link: receiveBlockHash,
            work,
            signature,
        };
        return { block: transaction, subtype: 'receive' };
    }
    /**
     * Generate address secret key from parent seed and account index
     *
     * @param seedBytes
     * @param accountIndex
     * @returns {Promise<{Uint8Array}>}
     */
    async generateAccountSecretKeyBytes(seedBytes, accountIndex) {
        const accountBytes = this.hexToUint8(this.decToHex(accountIndex, 4));
        const blake = await blakeLazyLoaded.get();
        const context = blake.blake2bInit(32);
        blake.blake2bUpdate(context, seedBytes);
        blake.blake2bUpdate(context, accountBytes);
        return blake.blake2bFinal(context);
    }
    /**
     * Convert address to public key
     *
     * @param {string} address
     * @returns {Promise<{string}>}
     */
    async getAccountPublicKey(address) {
        const { keyFromAccount } = await nanoNodeFunctionsLazyLoaded.get();
        return keyFromAccount(address.replace('nano', 'xrb'));
    }
    /**
     * Generate keyPair from secret key
     *
     * @param accountSecretKeyBytes
     * @returns {Promise<{publicKey: Uint8Array, secretKey: Uint8Array}>}
     *
     */
    async generateAccountKeyPair(accountSecretKeyBytes) {
        const { default: nacl } = await nanoNodeNaclLazyLoaded.get();
        return nacl.sign.keyPair.fromSecretKey(accountSecretKeyBytes);
    }
    /**
     * @param hexValue
     * @returns {Uint8Array}
     */
    hexToUint8(hexValue) {
        const length = Math.floor(hexValue.length / 2);
        const uint8 = new Uint8Array(length);
        for (let index = 0; index < length; index += 1) {
            uint8[index] = parseInt(hexValue.substr(index * 2, 2), 16);
        }
        return uint8;
    }
    /**
     * @param decValue
     * @param bytes
     * @returns {string}
     */
    decToHex(decValue, bytes = null) {
        let hex = Number(decValue).toString(16);
        if (hex.length % 2 !== 0) {
            hex = `0${hex}`;
        }
        if (bytes > hex.length / 2) {
            const diff = bytes - hex.length / 2;
            for (let jndex = 0; jndex < diff; jndex += 1) {
                hex = `00${hex}`;
            }
        }
        return hex;
    }
    /**
     * @param payload
     * @param remainingBalance
     * @returns {Promise<{string}>}
     */
    async signSendBlock(payload, remainingBalance) {
        const [blake, { default: nacl }] = await Promise.all([blakeLazyLoaded.get(), nanoNodeNaclLazyLoaded.get()]);
        const context = blake.blake2bInit(32, null);
        let remainingPadded = remainingBalance.toString(16);
        while (remainingPadded.length < 32) {
            remainingPadded = `0${remainingPadded}`; // Left pad with 0's
        }
        const [accountPublicKeyFromAddress, accountPublicKeyFromAccountState] = await Promise.all([
            this.getAccountPublicKey(this.address),
            this.getAccountPublicKey(this.account_state.representative),
        ]);
        blake.blake2bUpdate(context, this.hexToUint8(STATE_BLOCK_PREAMBLE));
        blake.blake2bUpdate(context, this.hexToUint8(accountPublicKeyFromAddress));
        blake.blake2bUpdate(context, this.hexToUint8(this.account_state.frontier));
        blake.blake2bUpdate(context, this.hexToUint8(accountPublicKeyFromAccountState));
        blake.blake2bUpdate(context, this.hexToUint8(remainingPadded));
        blake.blake2bUpdate(context, payload);
        const hashBytes = blake.blake2bFinal(context);
        // Sign the hash bytes with the account priv key bytes
        const secretKeyBytes = this.hexToUint8(this.#privateKey);
        const signed = nacl.sign.detached(hashBytes, secretKeyBytes);
        return Buffer.from(signed).toString('hex');
    }
    async getWork(hash) {
        return this.getProvider('workGenerate').workGenerate(hash);
    }
    async confirmAllPendingBlocks() {
        const pending = await this.getProvider('history').getPendingTransactions(this.address);
        if (Array.isArray(pending.blocks)) {
            for (const block of pending.blocks) {
                await this.confirmPendingBlock(block);
            }
        }
    }
    async confirmPendingBlock(block) {
        if (typeof block !== 'string' || block.length !== BLOCK_HASH_LENGTH) {
            throw new Error(`[NANO] confirmPendingBlock error: incorrect block hash: ${block}`);
        }
        const tx = await this.createReceiveTransaction(block);
        await this.sendTransaction(tx);
        await new Promise((resolve, reject) => setTimeout(async () => {
            resolve(true);
        }, PENDING_CONFIRMATION_TIMEOUT));
    }
    async getTransactions() {
        this.confirmAllPendingBlocks(); // no await, confirm in background
        const pending = this.account_state.pending ? this.account_state.pending.blocks : [];
        return this.getProvider('history').getTransactions({
            address: this.address,
            pending,
        });
    }
    async getInfo() {
        try {
            const info = await this.explorer.getInfo(this.address);
            this.balance = info.balance;
            this.account_state = info;
            return info;
        }
        catch (error) {
            if (error.message === ERR_ACC_NOT_FOUND) {
                this.balance = '0';
                this.account_state = ACC_EMPTY_STATE;
            }
            throw error;
        }
    }
    /**
     * The function adds a pending transaction to the transaction history.
     * The database is not used intentionally, as when using the database,
     * there are problems with updating the hash of transactions already stored in
     * the database. More precisely, the hash is updated without problems, but
     * there is no code that would update the hash of the memory transaction.
     * See updatePendingOrCreate for the History class.
     * @param  Transaction tx
     */
    async pushTx(tx) {
        if (tx.txid === 'pending') {
            this.transactions = [tx, ...this.transactions];
            if (tx.direction) {
                this.eventEmitter.emit('socket::newtx', {
                    id: this.id,
                    ticker: this.ticker,
                    amount: tx.amount,
                });
            }
            return;
        }
        // update transactions list
        const hasTx = this.transactions.find((walletTx) => walletTx.txid === tx.txid);
        // websocket can double-send events
        // only push tx to list when there it is not in the list already
        if (!hasTx) {
            // in case we have pending tx we shoul only update tx hash
            const pendingTx = this.transactions.find((walletTx) => walletTx.txid === 'pending' && walletTx.otherSideAddress === tx.otherSideAddress);
            // in case there is no pending tx just push it to the list
            if (!pendingTx) {
                this.transactions = [tx, ...this.transactions];
                if (tx.direction) {
                    this.eventEmitter.emit('socket::newtx', {
                        id: this.id,
                        ticker: this.ticker,
                        amount: tx.amount,
                    });
                }
            }
            else {
                pendingTx.txid = tx.txid;
                this.transactions = [...this.transactions];
            }
        }
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
}
export default NANOCoin;
//# sourceMappingURL=NANOCoin.js.map
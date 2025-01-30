import { Coin } from '../../abstract/index.js';
import EOSApiExplorer from '../../explorers/collection/EOSApiExplorer.js';
import EOSNodeExplorer from '../../explorers/collection/EOSNodeExplorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { HasProviders } from '../mixins/index.js';
const eccLazyLoaded = new LazyLoadedLib(() => import('eosjs-ecc'));
const NAME = 'EOS';
const TICKER = 'EOS';
const DECIMAL = 4;
const UNSPENDABLE_BALANCE = '0';
const ADDRESS_LENGTH = 13;
const DERIVATION = ''; // not use
class EOSCoin extends HasProviders(Coin) {
    #privateKey;
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object}  feeData represents fee
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
            txWebUrl,
            explorers,
            socket,
        };
        super(config);
        this.derivation = DERIVATION;
        this.setExplorersModules([EOSNodeExplorer, EOSApiExplorer]);
        this.loadExplorers(config);
        this.fields.paymentId = true;
        this.assetName = 'eosio.token';
        this.accountActivationSum = feeData.accountActivationSum;
        this.accountActivationAddress = feeData.accountActivationAddress;
        this.transactions = [];
        // @TODO should be providers
        // const nodeExplorer = explorers.find(({ className }) => className === 'EOSNodeExplorer')
        //
        // const apiExplorer = explorers.find(({ className }) => className === 'EOSApiExplorer')
        // this.explorers.push(new EOSNodeExplorer(this.instance, nodeExplorer.baseUrl, txWebUrl))
        // this.apiExplorer = new EOSApiExplorer(this.instance, apiExplorer.baseUrl, txWebUrl, apiExplorer.apiKey)
        this.balances = null;
    }
    /**
     * @deprecated this is not related to coin activation, don't use it. Remove it if there is nothing using this.
     */
    get activated() {
        return !!this.address;
    }
    /**
     * Loads a wallet.
     *
     * @param {Buffer} seed Seed buffer from BitcoreMnemonic
     * @param {String} phrase The mnemonic string
     * @return {Promise<Coin>}
     */
    async loadWallet(seed, phrase) {
        const { default: ecc } = await eccLazyLoaded.get();
        const masterKeyInstance = ecc.PrivateKey.fromSeed(phrase);
        if (!masterKeyInstance) {
            throw new Error(`${this.ticker} privateKey is empty`);
        }
        const ownerPrivate = masterKeyInstance.getChildKey('owner');
        const activePrivate = ownerPrivate.getChildKey('active');
        const ownerPublicKey = ownerPrivate.toPublic().toString();
        const ownerPrivateKey = ownerPrivate.toWif();
        const activePublicKey = activePrivate.toPublic().toString();
        const activePrivateKey = activePrivate.toWif();
        this.privateKeysObject = {
            owner: {
                privateKey: ownerPrivateKey,
                publicKey: ownerPublicKey,
            },
            active: {
                privateKey: activePrivateKey,
                publicKey: activePublicKey,
            },
        };
        this.#privateKey = JSON.stringify(this.privateKeysObject);
        if (!this.address) {
            this.resolveAccountName(activePublicKey);
        }
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    resolveAccountName(activePublicKey) {
        return this.getProvider('checkActivation')
            .getKeyAccounts(activePublicKey)
            .then((accountsInfo) => {
            if (accountsInfo && accountsInfo.length > 0) {
                this.address = accountsInfo[0];
            }
        })
            .catch(() => { });
    }
    /**
     * The address getter
     *
     * @return {String}
     */
    getAddress() {
        return this.address;
    }
    async validateNewAccountName(account) {
        const valid = await this.getProvider('checkActivation').checkAccountName(account);
        return valid;
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
        return address.length <= ADDRESS_LENGTH && /^[a-z1-5.]{1,11}[a-z1-5]$|^[a-z1-5.]{12}[a-j1-5]$/.test(address);
    }
    /**
     * Creates a transaction.
     *
     * @param {String} address The destination address
     * @param {Number} amount The amount to send
     * @param {String} memo Payment id / memo string
     * @return {Promise<String>} Raw transaction
     */
    async createTransaction({ address, amount, memo }) {
        const tx = {
            actions: [
                {
                    account: this.assetName,
                    name: 'transfer',
                    authorization: [
                        {
                            actor: this.address,
                            permission: 'active',
                        },
                    ],
                    data: {
                        from: this.address,
                        to: address,
                        quantity: `${Number(this.toCurrencyUnit(amount)).toFixed(DECIMAL)} ${this.ticker}`,
                        memo,
                    },
                },
            ],
        };
        return JSON.stringify(tx);
    }
    async sendTransaction(rawtx) {
        return this.getProvider('send').sendTransaction(rawtx, this.#privateKey);
    }
    async getInfo() {
        if (this.address) {
            const account = await this.getProvider('balance').getAccount(this.address);
            this.balance = account.core_liquid_balance ? this.toMinimalUnit(account.core_liquid_balance.split(' ')[0]) : 0;
            const totalStakedNet = Number(account.total_resources.net_weight.split(' ')[0]);
            const totalStakedCpu = Number(account.total_resources.cpu_weight.split(' ')[0]);
            const selfStakedNet = Number(account.self_delegated_bandwidth.net_weight.split(' ')[0]);
            const selfStakedCpu = Number(account.self_delegated_bandwidth.cpu_weight.split(' ')[0]);
            const othersStakedNet = totalStakedNet - selfStakedNet;
            const othersStakedCpu = totalStakedCpu - selfStakedCpu;
            this.balances = {
                net: account.net_limit,
                cpu: account.cpu_limit,
                ram: {
                    ramUsage: account.ram_usage,
                    ramQuota: account.ram_quota,
                    ramBytesTotal: account.total_resources.ram_bytes,
                },
                staked: {
                    selfStakedNet,
                    selfStakedCpu,
                    othersStakedNet,
                    othersStakedCpu,
                    totalStakedNet,
                    totalStakedCpu,
                },
            };
        }
        return {
            balance: this.balance,
            balances: this.balances,
        };
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
}
export default EOSCoin;
//# sourceMappingURL=EOSCoin.js.map
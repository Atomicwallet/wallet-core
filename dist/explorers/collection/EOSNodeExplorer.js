import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { ExplorerRequestError, WalletError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { SEND_TRANSACTION_TYPE, LOAD_WALLET_ERROR, PUBLIC_KEY_TO_ADDRESS_ERROR } from '../../utils/const/index.js';
const TX_CONFIRMATIONS = 10;
class EOSNodeExplorer extends Explorer {
    getAllowedTickers() {
        return ['EOS'];
    }
    /**
     * Get accounts for public_key
     * @param publicKey
     * @returns {Promise<*>}
     */
    async getKeyAccounts(publicKey) {
        const response = await this.request(`${this.getApiPrefix()}history/get_key_accounts`, 'post', {
            public_key: publicKey,
        }, 'KeyAccountInfo');
        if (!response.account_names) {
            throw new WalletError({
                type: LOAD_WALLET_ERROR,
                error: new Error(`${PUBLIC_KEY_TO_ADDRESS_ERROR}${this.config.baseUrl}`),
                instance: this,
            });
        }
        return response.account_names;
    }
    async checkAccountName(account) {
        const response = await this.request(`${this.getApiPrefix()}chain/get_account`, 'post', {
            account_name: account,
        }, 'checkAccountName').catch(() => {
            console.warn(`${account} is already in use`);
        });
        if (response && response.permissions && response.permissions.length > 0) {
            return false;
        }
        return true;
    }
    getInfoUrl(address) {
        return `${this.getApiPrefix()}chain/get_currency_balance`;
    }
    getApiPrefix() {
        return '/v1/';
    }
    getInfoMethod() {
        return 'post';
    }
    getInfoParams(address) {
        return {
            code: this.wallet.assetName,
            account: address,
        };
    }
    modifyInfoResponse(response) {
        return {
            balance: response,
            transactions: [],
        };
    }
    getTransactionsUrl(address) {
        return `${this.getApiPrefix()}history/get_actions`;
    }
    getTransactionsMethod() {
        return 'post';
    }
    getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
        return {
            pos: -1,
            offset: -limit,
            account_name: address,
        };
    }
    modifyTransactionsResponse(response, address) {
        return super.modifyTransactionsResponse(response.actions
            .filter((transaction) => {
            return (this.wallet.assetName === transaction.action_trace.act.account &&
                transaction.action_trace.act.name === 'transfer');
        })
            .reduce((unique, object) => {
            if (!unique.some((obj) => obj.action_trace.trx_id === object.action_trace.trx_id)) {
                unique.push(object);
            }
            return unique;
        }, [])
            .reverse(), address);
    }
    getTxHash(tx) {
        return tx.action_trace.trx_id;
    }
    getTxDirection(selfAddress, tx) {
        return tx.action_trace.act.data.to === selfAddress;
    }
    getTxOtherSideAddress(selfAddress, tx) {
        return tx.action_trace.act.data.to === selfAddress ? tx.action_trace.act.data.from : tx.action_trace.act.data.to;
    }
    getTxValue(selfAddress, tx) {
        const amount = tx.action_trace.act.data.quantity.split(' ');
        return Number(amount[0]);
    }
    getTxDateTime(tx) {
        return new Date(tx.action_trace.block_time);
    }
    getTxConfirmations(tx) {
        return TX_CONFIRMATIONS;
    }
    getTxMemo(tx) {
        return tx.action_trace.act.data.memo;
    }
    async sendTransaction(rawtx, privateKey) {
        const transaction = JSON.parse(rawtx);
        const eos = new Api({
            rpc: new JsonRpc(this.config.baseUrl.replace(/\/$/, ''), { fetch }),
            signatureProvider: new JsSignatureProvider([JSON.parse(privateKey).active.privateKey]),
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder(),
        });
        try {
            const response = await eos.transact(transaction, {
                blocksBehind: 10,
                expireSeconds: 3600,
            });
            return {
                txid: response.transaction_id,
            };
        }
        catch (error) {
            if (error.message && error.message.indexOf('CPU') + 1) {
                return { error: 'CPU' };
            }
            else if (error.message && error.message.indexOf('RAM') + 1) {
                return { error: 'RAM' };
            }
            throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error,
                instance: this,
            });
        }
    }
    async getAccount(address) {
        return this.request(`${this.getApiPrefix()}chain/get_account`, 'post', {
            account_name: address,
        });
    }
    getTxFee() {
        return 0;
    }
}
export default EOSNodeExplorer;
//# sourceMappingURL=EOSNodeExplorer.js.map
import { ETHPLORER_API_KEY } from '../../env.js';
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
import TOKENS_CACHE from '../../resources/eth/tokens.json';
import { GET_BALANCE_TYPE } from '../../utils/index.js';
const USER_TOKEN_LIST = 'https://api.ethplorer.io/getAddressInfo/{address}';
const MAX_CONFIRMATIONS = 10;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
class EthplorerExplorer extends Explorer {
    getAllowedTickers() {
        return ['ETH'];
    }
    /**
     * Gets the balance.
     *
     * @return {string}
     */
    async getBalance() {
        const info = await this.getInfo();
        return String(this.wallet.toCurrencyUnit(info.balance));
    }
    async getInfo(address) {
        try {
            const response = await this.request(this.getInfoUrl(address), this.getInfoMethod(), this.getInfoParams(address), GET_BALANCE_TYPE);
            return this.modifyInfoResponse(response, address);
        }
        catch (error) {
            const balance = address ? await this.wallet.coreLibrary.eth.getBalance(address) : 0;
            return { balance };
        }
    }
    getInfoUrl(address) {
        return 'service/service.php';
    }
    getInfoParams(address) {
        return {
            data: address,
            apiKey: ETHPLORER_API_KEY,
            page: 'pageSize=1000',
        };
    }
    modifyInfoResponse(response) {
        if (Array.isArray(response.transfers)) {
            const walletTransactions = [];
            const tokenTransactions = {};
            response.transfers.forEach((tx) => {
                tx.contract = tx.contract.toLowerCase();
                const transaction = tx.isEth
                    ? this.modifyTransactionResponse(tx)
                    : this.modifyTokenTransactionResponse(tx, this.wallet.tokens[tx.contract]);
                if (tx.isEth) {
                    walletTransactions.push(transaction);
                    return;
                }
                if (this.wallet.tokens[tx.contract]) {
                    tokenTransactions[tx.contract] = tokenTransactions[tx.contract] || [];
                    tokenTransactions[tx.contract].push(transaction);
                }
            });
            this.wallet.transactions = walletTransactions;
            for (const contract in tokenTransactions) {
                this.wallet.tokens[contract].transactions = tokenTransactions[contract];
            }
        }
        return {
            balance: this.wallet.toMinimalUnit(response.balance),
            transactions: [],
        };
    }
    getTransactionsUrl(address) {
        return 'service/service.php';
    }
    getTransactionsParams(address, offset, limit) {
        return {
            data: address,
            apiKey: ETHPLORER_API_KEY,
            page: 'pageSize=1000',
        };
    }
    modifyTransactionsResponse(response) {
        return response.transfers
            .map((tx) => {
            if (tx.isEth) {
                return this.modifyTransactionResponse(tx);
            }
            const token = this.wallet.tokens[tx.contract.toLowerCase()];
            this.modifyTokenTransactionResponse(tx, token);
            return false;
        })
            .filter(Boolean);
    }
    /**
     * Modify transaction response
     *
     * @param {Object} response
     * @return {Transaction}
     */
    modifyTokenTransactionResponse(tx, token, address) {
        return new Transaction({
            ticker: token.ticker,
            name: token.name,
            walletid: this.wallet.id,
            txid: this.getTxHash(tx),
            fee: this.getTxFee(tx),
            feeTicker: this.wallet.parent,
            direction: this.getTxDirection(address, tx),
            otherSideAddress: this.getTxOtherSideAddress(address, tx),
            amount: this.getTxValue(address, tx),
            datetime: this.getTxDateTime(tx),
            memo: this.getTxMemo(tx),
            confirmations: this.getTxConfirmations(tx),
            alias: this.wallet.alias,
        });
    }
    getTxHash(tx) {
        return tx.transactionHash;
    }
    getTxDateTime(tx) {
        return new Date(Number(`${tx.timestamp}000`));
    }
    getTxConfirmations(tx) {
        return Number(tx.blockNumber > 0 ? MAX_CONFIRMATIONS : 0);
    }
    getTxDirection(selfAddress, tx) {
        return selfAddress.toLowerCase() !== tx.from.toLowerCase();
    }
    getTxOtherSideAddress(selfAddress, tx) {
        return selfAddress.toLowerCase() === tx.from.toLowerCase() ? tx.to : tx.from;
    }
    getTxValue(selfAddress, tx) {
        if (tx.isEth) {
            return tx.value;
        }
        const token = this.wallet.tokens[tx.contract.toLowerCase()];
        if (token) {
            return token.toCurrencyUnit(tx.value);
        }
        return this.wallet.toCurrencyUnit(tx.value);
    }
    /**
     * Returns user token list url
     * @returns {String}
     */
    getUserTokenListUrl(address) {
        return USER_TOKEN_LIST.replace('{address}', address);
    }
    modifyTokenListResponse(response) {
        return response.data;
    }
    /**
     * Returns all token list data
     * @returns {Array}
     */
    async getTokenList() {
        const tokens = TOKENS_CACHE;
        // @TODO implement fetch tokens list
        return tokens;
    }
    /**
     * Returns user token list data
     * @param {String} address
     * @returns {Array}
     */
    async getUserTokenList(address) {
        if (!address) {
            return [];
        }
        const response = await this.request(this.getUserTokenListUrl(address), this.getInfoMethod(), {
            apiKey: ETHPLORER_API_KEY,
        })
            .then((data) => data.tokens)
            .catch(() => []); // user token list is loaded from db in HasTokensMixin
        return response;
    }
}
export default EthplorerExplorer;
//# sourceMappingURL=EthplorerExplorer.js.map
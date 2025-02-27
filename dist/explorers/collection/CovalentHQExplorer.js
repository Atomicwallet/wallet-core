import { ExplorerRequestError } from '../../errors/index.js';
import { TxTypes } from '../../explorers/enum/index.js';
import Explorer from '../../explorers/explorer.js';
import { logger, getTokenId } from '../../utils/index.js';
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, HTTP_STATUS_NOT_FOUND } from '../../utils/index.js';
import { toCurrency } from '../../utils/convert.js';
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
/**
 * Class for explorer.
 *
 * @class {CovalentHQExplorer}
 */
class CovalentHQExplorer extends Explorer {
    constructor({ wallet, config }) {
        super({ wallet, config });
    }
    modifyTokenResponse(response) {
        if (response.data && !response.data.error) {
            return response.data.items;
        }
        throw new ExplorerRequestError({
            type: GET_BALANCE_TYPE,
            error: new Error(JSON.stringify(response)),
            instance: this,
        });
    }
    handleRequestError(error, reqArgs) {
        if (error.response?.status === HTTP_STATUS_NOT_FOUND) {
            switch (reqArgs.type) {
                case GET_TRANSACTIONS_TYPE:
                    return {
                        transactions: [],
                    };
            }
            return null;
        }
        return super.handleRequestError(error, reqArgs);
    }
    /**
     *
     * @param {string} address - Wallet address.
     * @returns {Promise<object[]>}
     */
    async getUserTokenList(address) {
        try {
            const response = await this.request(`${this.wallet.chainId}/address/${address}/balances_v2/`, 'get');
            if (!response?.data) {
                return [];
            }
            const tokens = this.modifyTokenResponse(response);
            return tokens.map((token) => this.#mapToTokenFormat(token));
        }
        catch (error) {
            logger.log({ instance: this, error });
            return [];
        }
    }
    #mapToTokenFormat(token) {
        return {
            name: token.contract_name,
            ticker: token.contract_ticker_symbol,
            decimal: Number(token.contract_decimals) || 0,
            contract: token.contract_address.toLowerCase(),
            parentTicker: this.wallet.ticker,
            uniqueField: token.contract_address.toLowerCase(),
            supportedStandards: token.supports_erc,
        };
    }
    getTransactionsUrl(address, offset, limit, pageNum) {
        return `${this.wallet.chainId}/address/${address}/transactions_v2/`;
    }
    getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit, pageNum) {
        return { 'page-size': limit, 'page-number': pageNum };
    }
    /**
     * Modify transaction list response
     *
     * @param {object} response
     */
    modifyTransactionsResponse(response, address) {
        if (response.data && !response.data.error) {
            return super.modifyTransactionsResponse(response.data.items, address);
        }
        throw new ExplorerRequestError({
            type: GET_BALANCE_TYPE,
            error: new Error(JSON.stringify(response)),
            instance: this,
        });
    }
    getTransactionsModifiedResponse(tx, selfAddress, asset = this.wallet.ticker) {
        const event = this.#getLogEvent(tx, selfAddress);
        return {
            ticker: this.getTxTicker(event),
            name: this.getTxName(event),
            walletid: this.getTxWalletId(tx, event),
            txid: tx.tx_hash,
            direction: this.getTxDirection(selfAddress, tx, event),
            otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx, event),
            amount: this.getTxValue(selfAddress, tx, event),
            datetime: new Date(tx.block_signed_at),
            memo: '',
            confirmations: 1,
            nonce: tx.tx_offset,
            alias: this.wallet.alias,
            explorer: this.constructor.name,
            txType: this.getTxType(event),
            fee: this.wallet.toCurrencyUnit(tx.fees_paid),
            feeTicker: this.wallet.feeTicker ?? this.wallet.ticker,
            isToken: this.getTxIsToken(event),
            isNft: this.getTxIsNft(event),
            contract: this.getTxContract(tx, event),
        };
    }
    /**
     * Gets valid log event
     *
     * @param {object} tx
     * @param {string} selfAddress
     * @returns {object|null}
     */
    #getLogEvent(tx, selfAddress) {
        const events = (tx.log_events ?? []).filter((event) => {
            const from = event.decoded?.params[0]?.value.toLowerCase();
            const to = event.decoded?.params[1]?.value.toLowerCase();
            return (from !== EMPTY_ADDRESS &&
                to !== EMPTY_ADDRESS &&
                (from === selfAddress.toLowerCase() || to === selfAddress.toLowerCase()));
        });
        if (events.length === 0) {
            return null;
        }
        return events.pop();
    }
    #getTxLogEventParams(event) {
        if (!event) {
            return {};
        }
        const eventParams = event.decoded?.params;
        const typeName = event.decoded?.name;
        const name = event.sender_name;
        const tickerSymbol = event.sender_contract_ticker_symbol;
        const decimal = event.sender_contract_decimals;
        const from = eventParams && eventParams[0]?.value;
        const to = eventParams && eventParams[1]?.value;
        const valueOrTokenId = eventParams && eventParams[2]?.value;
        return { typeName, name, tickerSymbol, decimal, from, to, valueOrTokenId };
    }
    getTxTicker(event) {
        if (this.getTxIsToken(event)) {
            const { tickerSymbol } = this.#getTxLogEventParams(event);
            return tickerSymbol;
        }
        return this.wallet.ticker;
    }
    getTxName(event) {
        const { typeName, name } = this.#getTxLogEventParams(event);
        return typeName ? name : this.wallet.name;
    }
    /**
     * Gets Tx wallet id
     *
     * @param {object} tx
     * @param {object} event
     * @returns {string|null}
     */
    getTxWalletId(tx, event) {
        if (this.getTxIsToken(event)) {
            const ticker = this.getTxTicker(event);
            const contract = this.getTxContract(tx, event);
            return getTokenId({ ticker, contract, parent: this.wallet.id });
        }
        return this.wallet.id;
    }
    /**
     * Gets the transaction direction.
     *
     * @param {string} selfAddress - The transaction event.
     * @param {object} tx - The transaction.
     * @param {object} event - The transaction event.
     * @return {boolean} - True if we accept transaction.
     */
    getTxDirection(selfAddress, tx, event) {
        const selfLowerCased = selfAddress.toLowerCase();
        if (!event) {
            return tx.to_address.toLowerCase() === selfLowerCased;
        }
        const { typeName, to } = this.#getTxLogEventParams(event);
        if (!typeName) {
            return to.toLowerCase() === selfLowerCased;
        }
        return typeof to === 'string' ? to.toLowerCase() === selfLowerCased : false;
    }
    getTxOtherSideAddress(selfAddress, tx, event) {
        const selfLowerCased = selfAddress.toLowerCase();
        if (!event) {
            return tx.to_address.toLowerCase() === selfLowerCased ? tx.from_address : tx.to_address;
        }
        const { typeName, to, from } = this.#getTxLogEventParams(event);
        if (!typeName) {
            return to.toLowerCase() === selfLowerCased ? tx.from_address : tx.to_address;
        }
        return typeof to === 'string' && to.toLowerCase() === selfLowerCased ? from : to;
    }
    /**
     * Gets Tx value
     *
     * @param {string} selfAddress
     * @param {object} tx
     * @param {object} event
     * @return {string|0|null}
     */
    getTxValue(selfAddress, tx, event) {
        if (!event) {
            return this.wallet.toCurrencyUnit(tx.value);
        }
        if (this.getTxIsToken(event)) {
            const { valueOrTokenId: value, decimal } = this.#getTxLogEventParams(event);
            return toCurrency(value, decimal);
        }
        if (this.getTxIsNft(event)) {
            return 'NFT';
        }
        return null;
    }
    /**
     * Gets Tx type
     *
     * @param {object} event
     * @returns {string}
     */
    getTxType(event) {
        if (this.getTxIsToken(event)) {
            return TxTypes.TRANSFER;
        }
        if (this.getTxIsNft(event)) {
            return TxTypes.TRANSFERNFT;
        }
        return TxTypes.TRANSACTION;
    }
    getTxIsToken(event) {
        const { typeName, decimal } = this.#getTxLogEventParams(event);
        return typeName === 'Transfer' && decimal > 0;
    }
    getTxIsNft(event) {
        const { typeName, decimal } = this.#getTxLogEventParams(event);
        return typeName === 'Transfer' && decimal === 0;
    }
    /**
     * Gets Tx contract
     *
     * @param {object} tx
     * @param {object} event
     * @returns {string|null}
     */
    getTxContract(tx, event) {
        return this.getTxIsToken(event) || this.getTxIsNft(event) ? tx.to_address : null;
    }
    /**
     * Gets a token's transaction list for a wallet
     * This method is implemented not to break compatibility with other explorers.
     * The getTransaction method gets the entire history, so here we return an empty array.
     *
     * @return {Promise<{tokenTransactions: object[]}>}
     */
    async getTokensTransactions(args) {
        return { tokenTransactions: [] };
    }
}
export default CovalentHQExplorer;
//# sourceMappingURL=CovalentHQExplorer.js.map
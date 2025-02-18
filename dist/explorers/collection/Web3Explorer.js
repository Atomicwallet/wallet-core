import { ExplorerRequestError, InternalError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
import { GET_BALANCE_TYPE, INTERNAL_ERROR } from '../../utils/const/index.js';
const balanceABItoken = [
    {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
    },
];
const MODERATED_GAS_PRICE_URL_TIMEOUT = 10000; // 10 seconds timeout
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
class Web3Explorer extends Explorer {
    constructor(...args) {
        super(...args);
        this.requestId = 0;
    }
    getAllowedTickers() {
        return ['ETH', 'ETC', 'BSC', 'MATIC', 'AVAX', 'FLR', 'FTM', 'FIL', 'ETHOP'];
    }
    // @TODO web3Explorer ref! Important
    async getInfo(address, coinOnly = false) {
        const balance = address
            ? await this.wallet.coreLibrary.eth.getBalance(address).catch((error) => {
                throw new ExplorerRequestError({
                    type: GET_BALANCE_TYPE,
                    error,
                    instance: this,
                });
            })
            : null;
        return { balance, transactions: [] };
    }
    async getTokensInfo(tokens, address) {
        const tokensLen = tokens.length;
        const batch = new this.wallet.coreLibrary.BatchRequest();
        for (let index = 0; index < tokensLen; index += 1) {
            const token = tokens[index];
            const contract = token.contract;
            const callback = (err, result) => {
                if (err) {
                    console.warn(`Web3Explorer: Failed to fetch ${token.ticker} token balance`, err);
                }
                token.balance = result;
            };
            batch.add(this.getTokenBalanceOfCall({
                address,
                contractAddress: contract.toLowerCase(),
            }, callback));
        }
        await batch.execute();
        return tokensLen;
    }
    async getTransaction(address, txId, tokens) {
        let txWallet = this.wallet;
        const tx = await this.wallet.coreLibrary.eth.getTransaction(txId);
        if (!tx) {
            return null;
        }
        const { timestamp } = await this.wallet.coreLibrary.eth.getBlock(tx.blockNumber);
        const { number } = await this.wallet.coreLibrary.eth.getBlock('latest');
        const receipt = await this.wallet.coreLibrary.eth.getTransactionReceipt(txId);
        if (tx.input !== '0x') {
            tx.inputDecode = this.decodeInput(tx.input);
            if (receipt && tx.inputDecode && tx.inputDecode.method === 'transfer') {
                if (receipt.to && tokens && typeof tokens[receipt.to.toLowerCase()] !== 'undefined') {
                    txWallet = tokens[receipt.to.toLowerCase()];
                }
            }
        }
        return new Transaction({
            ticker: txWallet.ticker,
            name: txWallet.name,
            walletid: txWallet.id,
            txid: this.getTxHash(tx),
            fee: this.getTxFee(tx),
            feeTicker: this.wallet.feeTicker,
            direction: this.getTxDirection(address, tx),
            otherSideAddress: this.getTxOtherSideAddress(address, tx),
            amount: this.getTxValue(address, tx, txWallet),
            datetime: new Date(Number(`${timestamp}000`)),
            memo: this.getTxMemo(tx),
            nonce: this.getTxNonce(tx),
            confirmations: number - tx.blockNumber,
            alias: txWallet.alias,
            status: (receipt && receipt.status) || '',
        });
    }
    async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
        return [];
    }
    sendTransaction(rawtx) {
        return new Promise((resolve, reject) => {
            this.wallet.coreLibrary.eth
                .sendSignedTransaction(rawtx)
                .on('transactionHash', (hash) => {
                resolve({
                    txid: hash,
                });
            })
                .catch((error) => reject(error));
        });
    }
    async getGasPrice() {
        const gasPrice = await this.wallet.coreLibrary.eth.getGasPrice();
        return { node: new this.wallet.BN(gasPrice) };
    }
    getGasPriceConfig() {
        // @TODO implement fetch gas config
        return null;
    }
    async getGasLimit() {
        // TODO rewrite to explorer.getLatestBlock
        const lastBlock = await this.wallet.coreLibrary.eth.getBlockNumber();
        const lastBlockInfo = await this.wallet.coreLibrary.eth.getBlock(lastBlock);
        return lastBlockInfo.gasLimit;
    }
    getTxHash(tx) {
        return tx.hash;
    }
    getTxDateTime(tx) {
        return new Date(Number(`${tx.timeStamp}000`));
    }
    getTxNonce(tx) {
        return tx.nonce;
    }
    getTxConfirmations(tx) {
        return Number(tx.confirmations);
    }
    /**
     * Gets the transaction direction.
     *
     * @param {Transaction} tx The transaction
     * @return {String} The transaction direction.
     */
    getTxDirection(selfAddress, tx) {
        return selfAddress.toLowerCase() !== tx.from.toLowerCase();
    }
    /**
     * @param tx
     * @return {string}
     */
    getTxOtherSideAddress(selfAddress, tx) {
        let toAddress = tx.to;
        if (tx.inputDecode && tx.inputDecode.method === 'transfer') {
            // contract
            try {
                toAddress = tx.inputDecode.params._to;
            }
            catch (error) {
                toAddress = `contr:${toAddress}`;
            }
        }
        return selfAddress.toLowerCase() === tx.from.toLowerCase() ? toAddress : tx.from;
    }
    /**
     * @param tx
     * @return {string}
     */
    getTxValue(selfAddress, tx, wallet = this.wallet) {
        let txValue = tx.value;
        if (tx.inputDecode && tx.inputDecode.method === 'transfer') {
            // contract
            try {
                txValue = tx.inputDecode.params._value;
            }
            catch (error) {
                txValue = 0;
            }
        }
        return wallet.toCurrencyUnit(txValue);
    }
    /**
     * get token balance by contract address
     * @param contractAddress
     * @return {Promise<any>}
     */
    async getTokenBalanceByContractAddress({ address, contractAddress }) {
        const nodeContractInfo = new this.wallet.coreLibrary.eth.Contract(balanceABItoken, contractAddress);
        return nodeContractInfo.methods.balanceOf(address).call();
    }
    getTokenBalanceOfCall({ address, contractAddress }, callback) {
        const nodeContractInfo = new this.wallet.coreLibrary.eth.Contract(balanceABItoken, contractAddress);
        return nodeContractInfo.methods.balanceOf(address).call.request(callback);
    }
    createSendTokenContract(contractAddress, addressFrom, addressTo, amount) {
        const contract = new this.wallet.coreLibrary.eth.Contract(this.getERC20ABI(), contractAddress, {
            from: addressFrom,
        });
        return contract.methods.transfer(addressTo, amount).encodeABI();
    }
    /**
     * @param {string} input
     * @return {Object|null}
     */
    decodeInput(input) {
        try {
            if (this.wallet.coreLibrary.utils.isHex(input)) {
                try {
                    return this.wallet.coreLibrary.utils.hexToString(input);
                }
                catch (error) {
                    // do nothing
                }
                const prefixLen = 4;
                const dataBuf = Buffer.from(input.replace(/^0x/, ''), 'hex');
                const inputMethod = `0x${dataBuf.slice(0, prefixLen).toString('hex')}`;
                const inputsBuf = dataBuf.slice(prefixLen);
                const result = { method: null, params: {} };
                this.getERC20ABI().forEach((object) => {
                    try {
                        const abiMethod = this.wallet.coreLibrary.eth.abi.encodeFunctionSignature(object);
                        const abiTypes = object.inputs ? object.inputs.map((x) => x.type) : [];
                        const attributes = object.inputs ? object.inputs.map((x) => x.name) : [];
                        if (inputMethod === abiMethod) {
                            const inputs = this.wallet.coreLibrary.eth.abi.decodeParameters(abiTypes, `0x${inputsBuf.toString('hex')}`);
                            result.method = object.name;
                            for (const index in inputs) {
                                if (typeof inputs[index] !== 'undefined') {
                                    result.params[attributes[index]] = inputs[index];
                                }
                            }
                        }
                    }
                    catch (error) {
                        return null;
                    }
                    return null;
                });
                return result;
            }
        }
        catch (error) {
            throw new InternalError({ type: INTERNAL_ERROR, error, instance: this });
        }
        return null;
    }
    /**
     * @return {Object[]}
     */
    getERC20ABI() {
        return [
            {
                constant: true,
                inputs: [],
                name: 'name',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_spender',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'approve',
                outputs: [
                    {
                        name: 'success',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'totalSupply',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                    },
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [
                    {
                        name: 'success',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [
                    {
                        name: '',
                        type: 'uint8',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'version',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                ],
                name: 'balanceOf',
                outputs: [
                    {
                        name: 'balance',
                        type: 'uint256',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'symbol',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'transfer',
                outputs: [
                    {
                        name: 'success',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_spender',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                    {
                        name: '_extraData',
                        type: 'bytes',
                    },
                ],
                name: 'approveAndCall',
                outputs: [
                    {
                        name: 'success',
                        type: 'bool',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        name: '_spender',
                        type: 'address',
                    },
                ],
                name: 'allowance',
                outputs: [
                    {
                        name: 'remaining',
                        type: 'uint256',
                    },
                ],
                payable: false,
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_initialAmount',
                        type: 'uint256',
                    },
                    {
                        name: '_tokenName',
                        type: 'string',
                    },
                    {
                        name: '_decimalUnits',
                        type: 'uint8',
                    },
                    {
                        name: '_tokenSymbol',
                        type: 'string',
                    },
                ],
                type: 'constructor',
            },
            {
                payable: false,
                type: 'fallback',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        indexed: true,
                        name: '_from',
                        type: 'address',
                    },
                    {
                        indexed: true,
                        name: '_to',
                        type: 'address',
                    },
                    {
                        indexed: false,
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'Transfer',
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        indexed: true,
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        indexed: true,
                        name: '_spender',
                        type: 'address',
                    },
                    {
                        indexed: false,
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'Approval',
                type: 'event',
            },
        ];
    }
}
export default Web3Explorer;
//# sourceMappingURL=Web3Explorer.js.map
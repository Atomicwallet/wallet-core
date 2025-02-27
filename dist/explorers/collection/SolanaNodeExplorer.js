import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createTransferCheckedInstruction, } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, StakeProgram, Transaction } from '@solana/web3.js';
import axios from 'axios';
import BN from 'bn.js';
import { getParsedNftAccountsByOwner, resolveToWalletAddress } from 'sol-rayz';
import { SOLNftToken } from '../../coins/nfts/index.js';
import { ExternalError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { EXTERNAL_ERROR, STAKE_ADDR_TYPE } from '../../utils/index.js';
import { getStringWithEnsuredEndChar, toCurrency } from '../../utils/convert.js';
const STAKE_DATA_LENGTH = 200;
/**
 * Solana JSON-RCP explorer
 *
 */
class SolanaNodeExplorer extends Explorer {
    #finalizedSocketListenerId;
    #confirmedSocketListenerId;
    constructor({ wallet, config }) {
        super({ wallet, config });
        this.connection = new Connection(config.baseUrl);
        this.socket = undefined;
    }
    setAxiosClient() {
        const { baseURL } = this.getInitParams();
        this.connection = new Connection(baseURL);
    }
    setSocketClient(endpoint) {
        this.socket = new Connection(endpoint);
    }
    getAllowedTickers() {
        return ['SOL'];
    }
    async getInfo(address) {
        const pubKey = new PublicKey(address);
        const response = await this.connection.getBalance(pubKey, 'finalized');
        return this.modifyInfoResponse(response);
    }
    modifyInfoResponse(response) {
        return {
            balance: String(response),
        };
    }
    async getCurrentSigs(pubkey, commitment = 'finalize') {
        const sigs = await this.connection.getConfirmedSignaturesForAddress2(pubkey, {}, commitment);
        return sigs
            .map(({ confirmationStatus, signature }) => {
            if (confirmationStatus === commitment) {
                return signature;
            }
            return undefined;
        })
            .filter(Boolean);
    }
    async getLatestBlock() {
        const response = await this.connection.getLatestBlockhash();
        return response;
    }
    modifyLatestBlockResponse(response) {
        return response && response.value;
    }
    async sendTransaction({ rawtx, signer }) {
        const txid = await this.connection.sendTransaction(rawtx, [signer]);
        return { txid };
    }
    async sendRawTransaction(rawtx) {
        const txid = await this.connection.sendRawTransaction(rawtx);
        return { txid };
    }
    /**
     * Gets fee for send a transaction
     *
     * @returns {Promise<string>}
     * @throws {ExternalError}
     */
    async getFee() {
        try {
            const transaction = new Transaction();
            transaction.feePayer = this.wallet.address;
            const { blockhash } = await this.getLatestBlock();
            transaction.recentBlockhash = blockhash;
            // Assume that there are no operations, only a transaction structure to estimate the fee
            const message = transaction.compileMessage();
            const { value: fee } = await this.connection.getFeeForMessage(message);
            return String(fee);
        }
        catch (error) {
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    getAccountInfo(pubKey) {
        const info = this.connection.getParsedAccountInfo(pubKey);
        return info;
    }
    getEpochInfo() {
        return this.connection.getEpochInfo('finalized');
    }
    getStakeProgramInfo(address) {
        return this.connection.getParsedProgramAccounts(StakeProgram.programId, {
            commitment: 'finalize',
            filters: [{ memcmp: { bytes: address, offset: 12 } }],
        });
    }
    /**
     * Fetch stake account info from the most recent block
     * which has reached 1 confirmation by the connected node (NOT THE WHOLE CLUSTER)
     * use commitment `confirmed` for 1 CLUSTER confirmation
     * or commitment `finalize` for whole cluster confirmation
     * @param address
     * @returns {Promise<{account: *, pubkey: *}>}
     */
    async getStakeAccountInfo(address) {
        const accountInfo = await this.connection.getParsedAccountInfo(new PublicKey(address), 'processed');
        return this.modifyStakeAccountInfo(accountInfo, address);
    }
    modifyStakeAccountInfo(response, address) {
        return { account: response.value, pubkey: new PublicKey(address) };
    }
    async getStakingBalance(props) {
        // fetch cached stake addresses from db
        const cachedAddrRows = []; // @TODO implement cache db for staking addresses
        let addresses = [];
        // map addresses if cache exists
        if (cachedAddrRows) {
            addresses = cachedAddrRows.map(({ address }) => address);
        }
        // If cached addresses exists then get account info for each cached address
        // else fetch huge `getStakeProgramInfo` request to get all existing stake account for specified address
        const stakeAccounts = addresses.length > 0
            ? await Promise.all(addresses.map((address) => this.getStakeAccountInfo(address)))
            : await this.getStakeProgramInfo(props.address);
        // re-map addresses from `getStakeProgramInfo` if no cache exists
        if ((addresses.length === 0 && stakeAccounts) || props.ignoreCache) {
            addresses = stakeAccounts.map(({ pubkey }) => {
                try {
                    return pubkey.toBase58();
                }
                catch {
                    return pubkey;
                }
            });
            // Insert addresses to DB, adding only new addresses
            // e.g. db.setAddr()
        }
        const { epoch } = await this.getEpochInfo();
        const accounts = stakeAccounts
            .map((info) => {
            // for empty addresses
            // rm saved address if not exists on B/C
            if (!info.account) {
                // db.removeAddr()
                return undefined;
            }
            /**
             * @TODO only returns delegation for now, need to implement `deactivate` and `withdrawals`
             */
            if (info.account.data.parsed.type !== 'delegated') {
                return undefined;
            }
            const accountAddress = info.pubkey.toBase58();
            const staked = info.account.lamports;
            const validator = info.account.data.parsed.info.stake.delegation.voter;
            const isDeactivated = Number.isSafeInteger(Number(info.account.data.parsed.info.stake.delegation.deactivationEpoch));
            const isAvailableForWithdraw = isDeactivated && Number(info.account.data.parsed.info.stake.delegation.deactivationEpoch) < epoch;
            return {
                accountAddress,
                staked,
                validator,
                isDeactivated,
                isAvailableForWithdraw,
            };
        })
            .filter(Boolean);
        const staked = accounts.reduce((prev, cur) => {
            return prev.add(new this.wallet.BN(cur.staked));
        }, new this.wallet.BN(0));
        return {
            staking: accounts,
            staked,
            total: accounts.reduce((acc, next) => {
                return acc.add(new BN(next.staked));
            }, new BN(0)),
        };
    }
    getTxInstruction(tx) {
        const parsedValues = { destination: '', source: '', lamports: 0 };
        tx.transaction.message.instructions.forEach((ins) => {
            if (['transfer', 'createAccount', 'createAccountWithSeed', 'delegate', 'deactivate', 'withdraw'].includes(ins.parsed.type)) {
                parsedValues.destination =
                    ins.parsed.info.destination || ins.parsed.info.voteAccount || ins.parsed.info.stakeAccount;
                parsedValues.source = ins.parsed.info.source || ins.parsed.info.stakeAuthority || ins.parsed.info.stakeAccount;
                if (ins.parsed.info.lamports) {
                    parsedValues.lamports = ins.parsed.info.lamports;
                }
            }
        });
        return parsedValues;
    }
    getTxHash(tx) {
        return tx.transaction.signatures[0];
    }
    getTxDirection(selfAddress, tx) {
        return this.getTxInstruction(tx).destination === selfAddress;
    }
    getTxOtherSideAddress(selfAddress, tx) {
        const { destination, source } = this.getTxInstruction(tx);
        return destination === selfAddress ? source : destination;
    }
    getTxValue(address, tx) {
        return toCurrency(this.getTxInstruction(tx).lamports, this.wallet.decimal);
    }
    getTxDateTime(tx) {
        return new Date(Number(`${tx.blockTime}000`));
    }
    getTxMemo(tx) {
        return '';
    }
    async getTransactions({ address }) {
        const sigs = await this.getCurrentSigs(new PublicKey(address), 'finalized');
        const txs = await this.connection.getParsedConfirmedTransactions(sigs, 'finalized');
        return this.modifyTransactionsResponse(txs, address);
    }
    async getSpecifiedTransactions(sigs, selfAddress) {
        const txs = await this.connection.getParsedConfirmedTransactions(sigs, 'confirmed');
        return this.modifyTransactionsResponse(txs, selfAddress);
    }
    modifyTransactionResponse(txs, selfAddress) {
        return txs.map((tx) => new Transaction({
            ticker: this.wallet.ticker,
            name: this.wallet.name,
            alias: this.wallet.alias,
            walletid: this.wallet.id,
            explorer: this.constructor.name,
            txid: this.getTxHash(tx),
            direction: this.getTxDirection(selfAddress, tx),
            otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
            amount: this.getTxValue(selfAddress, tx),
            datetime: this.getTxDateTime(tx),
            memo: this.getTxMemo(tx),
            confirmations: 1,
        }));
    }
    /**
     * Fetch minimal amount for rent stake
     * @param length
     * @returns {Promise<number>}
     */
    getMinRent(length = STAKE_DATA_LENGTH) {
        return this.connection.getMinimumBalanceForRentExemption(length);
    }
    async connectSocket(address) {
        const { baseUrl, websocketUrl } = this.config;
        if (this.#finalizedSocketListenerId) {
            this.socket.removeAccountChangeListener(this.#finalizedSocketListenerId);
            this.#finalizedSocketListenerId = null;
        }
        if (this.#confirmedSocketListenerId) {
            this.socket.removeAccountChangeListener(this.#confirmedSocketListenerId);
            this.#confirmedSocketListenerId = null;
        }
        this.setSocketClient(websocketUrl || baseUrl);
        const pubkey = new PublicKey(address);
        if (this.socket) {
            this.#finalizedSocketListenerId = this.socket.onAccountChange(pubkey, (event) => this.processBalanceChangeEvent(event, pubkey), 'finalized');
            this.#confirmedSocketListenerId = this.socket.onAccountChange(pubkey, (event) => this.processTxsChangeEvent(event, pubkey), 'confirmed');
        }
    }
    updateParams(params) {
        super.updateParams(params);
        if (params.websocketUrl && this.config.websocketUrl !== params.websocketUrl) {
            this.config.websocketUrl = params.websocketUrl;
            this.connectSocket(this.wallet.address);
        }
    }
    async processTxsChangeEvent(event, pubkey) {
        const sigs = await this.getCurrentSigs(pubkey, 'confirmed');
        const txs = await this.getSpecifiedTransactions(sigs, pubkey.toBase58());
        // TODO implement history data storage
        txs.forEach((tx) => {
            if (tx.direction) {
                this.eventEmitter.emit(`${this.wallet.parent}-${this.wallet.id}::new-socket-tx`, {
                    unconfirmedTx: tx,
                });
            }
        });
    }
    processBalanceChangeEvent(event, pubkey) {
        this.eventEmitter.emit(`update::${this.wallet.id}::balance`, event.lamports);
    }
    getTxFee(tx) {
        return this.wallet.toCurrencyUnit((tx.meta && tx.meta.fee) || 0);
    }
    getTxConfirmations() {
        return 1;
    }
    /**
     * @typedef {Object} FetchRawListResponse
     * @param {string} id - NFT id.
     * @param {string} name - NFT name.
     * @param {string} description - NFT description.
     * @param {string} image - Url to NFT image.
     */
    /**
     * Fetch raw NFT list owned by {address}
     * @async
     * @param {string} address - Owner address
     * @returns {Promise<{FetchRawListResponse}[]>} - NFTs fetched metadata list.
     * @throws {ExternalError} - Throws error receiving NFT list
     */
    async fetchRawList(address) {
        try {
            const publicAddress = await resolveToWalletAddress({
                text: address,
                connection: this.connection,
            });
            const rawList = await getParsedNftAccountsByOwner({
                publicAddress,
                connection: this.connection,
            });
            const urls = [];
            const rawTokens = rawList.map(({ mint, 
            // @TODO Research this
            // tokenStandard,
            data: { name, uri }, }) => {
                urls.push(uri);
                return {
                    tokenId: mint,
                    name,
                };
            });
            const additionalPropertyResults = await Promise.allSettled(urls.map((url) => axios.get(url)));
            for (let index = 0; index < rawTokens.length; index++) {
                const token = rawTokens[index];
                const { status, value, reason } = additionalPropertyResults[index];
                if (status === 'fulfilled') {
                    const { data: { description, image }, } = value;
                    token.description = description;
                    token.imageUrl = image;
                }
                else {
                    // @TODO token.description = 'Error getting token description'
                    // @TODO token.imageUrl = '<Some error url>'
                    console.warn(reason);
                }
            }
            return rawTokens;
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    /**
     * Gets Solana NFT list
     *
     * @async
     * @param {Object<Coin>} coin
     * @returns {Promise<SOLNftToken[]>}
     * @throws {ExternalError} - Throws error receiving NFT list
     */
    async fetchNftList(coin) {
        const { address, ticker } = coin;
        try {
            const rawList = await this.fetchRawList(address);
            return rawList.map(({ tokenId, name, description, imageUrl }) => new SOLNftToken(tokenId, ticker, name, description, imageUrl));
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    /**
     * Send Solana NFT to other wallet
     *
     * @async
     * @param {Object<Coin>} coin
     * @param {string} toAddress - destination wallet address.
     * @param {string | null} contractAddress - Not used in Solana.
     * @param {string} tokenId - Token id - Solana NFT mint used as id.
     * @param {string} [tokenStandard] - Token standard - not used in Solana.
     * @param {Object} [options] - Not used here.
     * @returns {Promise<{tx: string}>} - Transaction hash.
     * @throws {ExternalError} - Throws transfer NFT error.
     */
    async sendNft(coin, toAddress, contractAddress, tokenId, tokenStandard, options) {
        const fromKeypair = Keypair.fromSecretKey(coin.getPrivateKey());
        // Mint is the Mint address found in the NFT metadata
        const mintPublicKey = new PublicKey(tokenId);
        const destPublicKey = new PublicKey(toAddress);
        try {
            const fromTokenAccount = await getOrCreateAssociatedTokenAccount(this.connection, fromKeypair, mintPublicKey, fromKeypair.publicKey);
            const toTokenAccount = await getOrCreateAssociatedTokenAccount(this.connection, fromKeypair, mintPublicKey, destPublicKey);
            const transaction = new Transaction().add(createTransferCheckedInstruction(fromTokenAccount.address, mintPublicKey, toTokenAccount.address, fromKeypair.publicKey, 1, 0, [], TOKEN_PROGRAM_ID));
            const tx = await this.connection.sendTransaction(transaction, [fromKeypair]);
            return { tx };
        }
        catch (error) {
            console.warn(error);
            throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
        }
    }
    /**
     * Makes the NFT info url
     *
     * @param {string | null} contractAddress - Contract address (Not used here).
     * @param {string} tokenId - Token id.
     * @returns {string} - NFT info url.
     */
    makeNftInfoUrl(contractAddress, tokenId) {
        return `${getStringWithEnsuredEndChar(this.config.baseUrl, '/')}${tokenId}`;
    }
    async getUserTokenList() {
        const { value: splAccounts } = await this.connection.getParsedTokenAccountsByOwner(new PublicKey(this.wallet.address), {
            programId: new PublicKey(TOKEN_PROGRAM_ID),
        });
        const rawTokensList = [];
        splAccounts.forEach((acc) => {
            if (acc.account.data.program === 'spl-token' && acc.account.data.parsed.type === 'account') {
                rawTokensList.push(acc.account.data.parsed.info);
            }
        });
        return rawTokensList;
    }
    /**
     * Gets token balance
     * @param {string} mint
     * @returns {Promise<string|null>}
     */
    async getTokenBalance({ mint }) {
        try {
            const { value: splAccounts } = await this.connection.getParsedTokenAccountsByOwner(new PublicKey(this.wallet.address), {
                programId: new PublicKey(TOKEN_PROGRAM_ID),
            });
            splAccounts.forEach((acc) => {
                if (acc.account.data.program === 'spl-token' && acc.account.data.parsed.type === 'account') {
                    const parsedInfo = acc.account.data.parsed.info;
                    if (parsedInfo.mint === mint) {
                        return parsedInfo.tokenAmount.amount;
                    }
                }
                return null;
            });
            return null;
        }
        catch (error) {
            console.warn(error);
            return null;
        }
    }
}
export default SolanaNodeExplorer;
//# sourceMappingURL=SolanaNodeExplorer.js.map
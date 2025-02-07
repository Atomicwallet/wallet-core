export default NftMixin;
declare function NftMixin(superclass: any): {
    new (args: any, db: any, configManager: any): {
        [x: string]: any;
        /**
         * Get the NFT info url
         *
         * @param {string | null} contractAddress - NFT contract address.
         * @param {string} tokenId - Token id.
         * @returns {string} - NFT info url.
         */
        getNftInfoUrl(contractAddress: string | null, tokenId: string): string;
        /**
         * Get NFT list
         *
         * @async
         * @param {boolean} isSpamNftsEnabled
         * @returns {Promise<Object<NftToken>[]>}
         * @throws {ExternalError} - Throws error receiving NFT list
         */
        getNftList(isSpamNftsEnabled: boolean): Promise<Object<NftToken>[]>;
        /**
         * Transfer NFT to other address
         *
         * @async
         * @param {string | null} contractAddress - NFT contract address.
         * @param {string} tokenId - Token id.
         * @param {string} toAddress - Recipient address.
         * @param {Object} [options={}] - Some custom options.
         * @returns {Promise<{tx: string}>} - Transaction hash.
         * @throws {ExternalError} - NFT transfer error.
         * @throws {InternalError} - NFT token removing from local storage error.
         */
        transferNft(contractAddress: string | null, tokenId: string, toAddress: string, options?: Object): Promise<{
            tx: string;
        }>;
    };
    [x: string]: any;
};

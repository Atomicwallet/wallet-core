export default EOSApiExplorer;
declare class EOSApiExplorer extends Explorer {
    constructor(...args: any[]);
    apiKey: any;
    /**
     * @param {string} account
     * @returns {Promise<Boolean>}
     */
    validateNewAccountName(account: string): Promise<boolean>;
}
import Explorer from '../../explorers/explorer.js';

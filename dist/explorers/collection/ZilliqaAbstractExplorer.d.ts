export default ZilliqaAbstractExplorer;
declare class ZilliqaAbstractExplorer extends Explorer {
    getBech32Address(checksumAddr: any): string;
    getValidChecksumAddress(address: any): string;
    /**
     * Returns valid checksum addr
     * @param address
     * @returns {string}
     */
    toValidChecksumAddress(address: any): string;
}
import Explorer from '../../explorers/explorer.js';

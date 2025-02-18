export default class StacksHiroExplorer extends Explorer {
    getInfo(address: any): Promise<{
        balance: number;
    }>;
    getPossibleNextNonce(address: any): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';

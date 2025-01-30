export default class TerraMantleExplorer extends Explorer {
    getUserTokenList(userAddress: any, isClassic?: boolean): Promise<any[]>;
    getTokenList(isClassic?: boolean): Promise<any>;
    getBannedTokensList(): Promise<never[]>;
}
import Explorer from '../../explorers/explorer.js';

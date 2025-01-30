export default AtomicExplorer;
declare class AtomicExplorer extends Explorer {
    getInfo(address: any): Promise<{
        balance: any;
        balances: any;
    }>;
    getRewards(address: any): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';

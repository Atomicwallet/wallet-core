export default HederaStakingExplorer;
declare class HederaStakingExplorer extends Explorer {
    getInfoParams(): {
        limit: number;
    };
    /**
     * Creates and sends stake tx
     * @param {Object} wallet The HBAR wallet
     * @param {number|string} nodeId The staked node id
     * @return {Promise<string>} the tx hash
     */
    stake(wallet: Object, nodeId: number | string, privateKey: any): Promise<string>;
    /**
     * Creates and sends stake tx
     * @param {Object} wallet The HBAR wallet
     * @return {Promise<string>} the tx hash
     */
    unstake(wallet: Object, privateKey: any): Promise<string>;
    #private;
}
import Explorer from '../../explorers/explorer.js';

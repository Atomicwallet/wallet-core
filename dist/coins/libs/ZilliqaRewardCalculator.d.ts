export default class RewardCalculator {
    constructor(url: any, ssnlist: any);
    baseUrl: any;
    jsonBody: (params: any) => {
        id: string;
        jsonrpc: string;
        method: string;
        params: any[];
    };
    getRewards(ssnaddr: any, delegator: any): Promise<BN>;
    getRewardCycleList(last_withdraw_cycle_map: any, last_reward_cycle_json: any, ssnaddr: any, delegator: any): Promise<number[]>;
    getRewardNeedCycleList(last_withdraw_cycle_map: any, last_reward_cycle_json: any, ssnaddr: any, delegator: any): Promise<number[]>;
    combineBuffDirect(ssnaddr: any, delegator: any, reward_list: any): Promise<Map<any, any>>;
    calculateRewards(ssnaddr: any, delegate_per_cycle: any, need_list: any): Promise<BN>;
}
import BN from 'bn.js';

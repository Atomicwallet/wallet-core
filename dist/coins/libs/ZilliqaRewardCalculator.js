import axios from 'axios';
import BN from 'bn.js';
const KEY_LAST_REWARD_CYCLE = 'lastrewardcycle';
const KEY_DIRECT_DEPOSIT_DELEG = 'direct_deposit_deleg';
const KEY_BUFF_DEPOSIT_DELEG = 'buff_deposit_deleg';
const KEY_STAKE_SSN_PER_CYCLE = 'stake_ssn_per_cycle';
const KEY_LAST_WITHDRAW_CYCLE = 'last_withdraw_cycle_deleg';
const KEY_DELEG_PER_CYCLE = 'deleg_stake_per_cycle';
export default class RewardCalculator {
    constructor(url, ssnlist) {
        this.baseUrl = url;
        this.jsonBody = (params) => {
            return {
                id: 'atomic',
                jsonrpc: '2.0',
                method: 'GetSmartContractSubState',
                params: [ssnlist, ...params],
            };
        };
    }
    async getRewards(ssnaddr, delegator) {
        const last_withdraw_cycle_map_response = await axios.post(this.baseUrl, this.jsonBody([KEY_LAST_WITHDRAW_CYCLE, [delegator.toLowerCase()]]));
        const last_reward_cycle_json_response = await axios.post(this.baseUrl, this.jsonBody([KEY_LAST_REWARD_CYCLE, []]));
        const last_withdraw_cycle_map = last_withdraw_cycle_map_response.data.result;
        const last_reward_cycle_json = last_reward_cycle_json_response.data.result;
        const reward_list = await this.getRewardCycleList(last_withdraw_cycle_map, last_reward_cycle_json, ssnaddr, delegator);
        const delegate_per_cycle = await this.combineBuffDirect(ssnaddr, delegator, reward_list);
        const need_list = await this.getRewardNeedCycleList(last_withdraw_cycle_map, last_reward_cycle_json, ssnaddr, delegator);
        const rewards = await this.calculateRewards(ssnaddr, delegate_per_cycle, need_list);
        return rewards;
    }
    // get reward cycle list
    async getRewardCycleList(last_withdraw_cycle_map, last_reward_cycle_json, ssnaddr, delegator) {
        if (last_withdraw_cycle_map !== null &&
            last_withdraw_cycle_map[KEY_LAST_WITHDRAW_CYCLE][delegator][ssnaddr] !== undefined) {
            const last_reward_cycle = Number.parseInt(last_reward_cycle_json[KEY_LAST_REWARD_CYCLE]);
            const result_list = [];
            let i = 1;
            for (i; i <= last_reward_cycle; i++) {
                result_list.push(i);
            }
            return result_list;
        }
        return [];
    }
    // to get those cycles need to calculte rewards
    async getRewardNeedCycleList(last_withdraw_cycle_map, last_reward_cycle_json, ssnaddr, delegator) {
        // get last_reward_cycle;
        const last_reward_cycle = last_reward_cycle_json[KEY_LAST_REWARD_CYCLE];
        // get last_withdraw_cycle_deleg
        if (last_withdraw_cycle_map === null) {
            return [];
        }
        const last_withdraw_cycle = last_withdraw_cycle_map[KEY_LAST_WITHDRAW_CYCLE][delegator][ssnaddr];
        // to filter those elements that meet
        // last_withdraw_cycle < elements <= last_reward_cycle
        const reward_cycle_list_reverse = await this.getRewardCycleList(last_withdraw_cycle_map, last_reward_cycle_json, ssnaddr, delegator);
        const cycle_need_to_calculate = reward_cycle_list_reverse.filter((c) => c > Number.parseInt(last_withdraw_cycle) && c <= Number.parseInt(last_reward_cycle));
        return cycle_need_to_calculate;
    }
    // to combine buffered deposit map and direct deposit map
    // eventually get the actual delegate amount of every cycle for this particular ssn operator
    async combineBuffDirect(ssnaddr, delegator, reward_list) {
        const result_map = new Map();
        const direct_deposit_json_response = await axios.post(this.baseUrl, this.jsonBody([KEY_DIRECT_DEPOSIT_DELEG, [delegator.toLowerCase(), ssnaddr]]));
        const buffer_deposit_json_response = await axios.post(this.baseUrl, this.jsonBody([KEY_BUFF_DEPOSIT_DELEG, [delegator.toLowerCase(), ssnaddr]]));
        const deleg_stake_per_cycle_json_response = await axios.post(this.baseUrl, this.jsonBody([KEY_DELEG_PER_CYCLE, [delegator.toLowerCase(), ssnaddr]]));
        const direct_deposit_json = direct_deposit_json_response.data.result;
        const buffer_deposit_json = buffer_deposit_json_response.data.result;
        const deleg_stake_per_cycle_json = deleg_stake_per_cycle_json_response.data.result;
        let direct_deposit_map = null;
        let buffer_deposit_map = null;
        let deleg_stake_per_cycle_map = null;
        if (direct_deposit_json !== null) {
            direct_deposit_map = direct_deposit_json[KEY_DIRECT_DEPOSIT_DELEG][delegator.toLowerCase()][ssnaddr];
        }
        if (buffer_deposit_json !== null) {
            buffer_deposit_map = buffer_deposit_json[KEY_BUFF_DEPOSIT_DELEG][delegator.toLowerCase()][ssnaddr];
        }
        if (deleg_stake_per_cycle_json !== null) {
            deleg_stake_per_cycle_map = deleg_stake_per_cycle_json[KEY_DELEG_PER_CYCLE][delegator.toLowerCase()][ssnaddr];
        }
        reward_list.forEach((cycle) => {
            // for every reward cycle, we need to get
            // 1. cycle - 1 in direct deposit
            // 2. cycle - 2 in buffered deposit
            // 3. accumulate last result to get total amount for this cycle
            const c1 = cycle - 1;
            const c2 = cycle - 2;
            let hist_amt = new BN(0);
            if (deleg_stake_per_cycle_map !== null && deleg_stake_per_cycle_map[c1.toString()] !== undefined) {
                hist_amt = new BN(deleg_stake_per_cycle_map[c1.toString()]);
            }
            let dir_amt = new BN(0);
            if (direct_deposit_map !== null && direct_deposit_map[c1.toString()] !== undefined) {
                dir_amt = new BN(direct_deposit_map[c1.toString()]);
            }
            let buf_amt = new BN(0);
            if (buffer_deposit_map !== null && buffer_deposit_map[c2.toString()] !== undefined) {
                buf_amt = new BN(buffer_deposit_map[c2.toString()]);
            }
            let total_amt_tmp = dir_amt.add(buf_amt);
            total_amt_tmp = total_amt_tmp.add(hist_amt);
            const last_amt = result_map.get(c1);
            if (last_amt !== undefined) {
                const total_amt = total_amt_tmp.add(last_amt);
                result_map.set(cycle, total_amt);
            }
            else {
                result_map.set(cycle, total_amt_tmp);
            }
        });
        return result_map;
    }
    async calculateRewards(ssnaddr, delegate_per_cycle, need_list) {
        let result_rewards = new BN(0);
        const stake_ssn_per_cycle_map_response = await axios.post(this.baseUrl, this.jsonBody([KEY_STAKE_SSN_PER_CYCLE, [ssnaddr]]));
        const stake_ssn_per_cycle_map = stake_ssn_per_cycle_map_response.data.result;
        if (stake_ssn_per_cycle_map === null) {
            return result_rewards;
        }
        need_list.forEach((cycle) => {
            const cycle_info = stake_ssn_per_cycle_map[KEY_STAKE_SSN_PER_CYCLE][ssnaddr][cycle];
            if (cycle_info === undefined) {
                // no rewards for this cycle, just skip
            }
            else {
                const total_rewards = new BN(cycle_info.arguments[1]);
                const total_stake = new BN(cycle_info.arguments[0]);
                const deleg_amt = delegate_per_cycle.get(cycle);
                if (deleg_amt !== undefined) {
                    const rewards_tmp = deleg_amt.mul(total_rewards);
                    const rewards = rewards_tmp.div(total_stake);
                    result_rewards = result_rewards.add(rewards);
                }
            }
        });
        return result_rewards;
    }
}
//# sourceMappingURL=ZilliqaRewardCalculator.js.map
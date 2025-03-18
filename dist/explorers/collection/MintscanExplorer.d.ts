export default MintscanExplorer;
declare class MintscanExplorer extends Explorer {
    modifyInfoResponse(response: any): {
        balance: string;
        balances: {
            available: any;
            staking: {
                validators: {};
                total: any;
            };
            unbonding: {
                validators: {};
                total: any;
            };
            rewards: any;
        };
        transactions: any;
    };
}
import Explorer from '../../explorers/explorer.js';

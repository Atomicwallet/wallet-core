declare const _default: readonly [{
    readonly name: "approve";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly name: "balanceOf";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly name: "delegate";
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_to";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_bips";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly name: "delegatesOf";
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_owner";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "_delegateAddresses";
        readonly type: "address[]";
    }, {
        readonly internalType: "uint256[]";
        readonly name: "_bips";
        readonly type: "uint256[]";
    }, {
        readonly internalType: "uint256";
        readonly name: "_count";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "_delegationMode";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly name: "delegatesOfAt";
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_owner";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_blockNumber";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "_delegateAddresses";
        readonly type: "address[]";
    }, {
        readonly internalType: "uint256[]";
        readonly name: "_bips";
        readonly type: "uint256[]";
    }, {
        readonly internalType: "uint256";
        readonly name: "_count";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "_delegationMode";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly name: "delegationModeOf";
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_who";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly name: "deposit";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
    readonly type: "function";
}, {
    readonly name: "depositTo";
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "recipient";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes4";
        readonly name: "_selector";
        readonly type: "bytes4";
    }];
    readonly name: "executeGovernanceCall";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "governance";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "governanceSettings";
    readonly outputs: readonly [{
        readonly internalType: "contract IGovernanceSettings";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "governanceVotePower";
    readonly outputs: readonly [{
        readonly internalType: "contract IGovernanceVotePower";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "addedValue";
        readonly type: "uint256";
    }];
    readonly name: "increaseAllowance";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_initialGovernance";
        readonly type: "address";
    }];
    readonly name: "initialise";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly internalType: "string";
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "productionMode";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "readVotePowerContract";
    readonly outputs: readonly [{
        readonly internalType: "contract IVPContractEvents";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_who";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_blockNumber";
        readonly type: "uint256";
    }];
    readonly name: "revokeDelegationAt";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_cleanerContract";
        readonly type: "address";
    }];
    readonly name: "setCleanerContract";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "_blockNumber";
        readonly type: "uint256";
    }];
    readonly name: "setCleanupBlockNumber";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalVotePower";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "undelegateAll";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "_delegateAddresses";
        readonly type: "address[]";
    }];
    readonly name: "undelegateAllExplicit";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "_remainingDelegation";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_from";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "_to";
        readonly type: "address";
    }];
    readonly name: "votePowerFromTo";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_owner";
        readonly type: "address";
    }];
    readonly name: "votePowerOf";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_owner";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_blockNumber";
        readonly type: "uint256";
    }];
    readonly name: "votePowerOfAtIgnoringRevocation";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}];
export default _default;

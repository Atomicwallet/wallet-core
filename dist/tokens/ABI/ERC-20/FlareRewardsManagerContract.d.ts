declare const _default: readonly [{
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_beneficiary";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_rewardEpoch";
        readonly type: "uint256";
    }];
    readonly name: "getStateOfRewards";
    readonly outputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "_dataProviders";
        readonly type: "address[]";
    }, {
        readonly internalType: "uint256[]";
        readonly name: "_rewardAmounts";
        readonly type: "uint256[]";
    }, {
        readonly internalType: "bool[]";
        readonly name: "_claimed";
        readonly type: "bool[]";
    }, {
        readonly internalType: "bool";
        readonly name: "_claimable";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_rewardOwner";
        readonly type: "address";
    }, {
        readonly internalType: "address payable";
        readonly name: "_recipient";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_rewardEpoch";
        readonly type: "uint256";
    }, {
        readonly internalType: "bool";
        readonly name: "_wrap";
        readonly type: "bool";
    }];
    readonly name: "claim";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "_rewardAmount";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_beneficiary";
        readonly type: "address";
    }];
    readonly name: "getEpochsWithUnclaimedRewards";
    readonly outputs: readonly [{
        readonly internalType: "uint256[]";
        readonly name: "_epochIds";
        readonly type: "uint256[]";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "newFtsoRewardManager";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "claimSetupManager";
    readonly outputs: readonly [{
        readonly internalType: "contract IIClaimSetupManager";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export default _default;

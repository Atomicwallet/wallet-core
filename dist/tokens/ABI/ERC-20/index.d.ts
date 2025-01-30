declare const _default: {
    readonly standard: {
        readonly methods: {
            readonly approve: {
                readonly name: "approve";
                readonly params: readonly ["address", "amount"];
            };
            readonly increaseAllowance: {
                readonly name: "increaseAllowance";
                readonly params: readonly ["address", "amount"];
            };
        };
        readonly abi: readonly [{
            readonly constant: true;
            readonly inputs: readonly [];
            readonly name: "name";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "string";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: false;
            readonly inputs: readonly [{
                readonly name: "_spender";
                readonly type: "address";
            }, {
                readonly name: "_value";
                readonly type: "uint256";
            }];
            readonly name: "approve";
            readonly outputs: readonly [{
                readonly name: "success";
                readonly type: "bool";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: true;
            readonly inputs: readonly [];
            readonly name: "totalSupply";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "uint256";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: false;
            readonly inputs: readonly [{
                readonly name: "_from";
                readonly type: "address";
            }, {
                readonly name: "_to";
                readonly type: "address";
            }, {
                readonly name: "_value";
                readonly type: "uint256";
            }];
            readonly name: "transferFrom";
            readonly outputs: readonly [{
                readonly name: "success";
                readonly type: "bool";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: true;
            readonly inputs: readonly [];
            readonly name: "decimals";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "uint8";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: true;
            readonly inputs: readonly [];
            readonly name: "version";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "string";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: true;
            readonly inputs: readonly [{
                readonly name: "_owner";
                readonly type: "address";
            }];
            readonly name: "balanceOf";
            readonly outputs: readonly [{
                readonly name: "balance";
                readonly type: "uint256";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: true;
            readonly inputs: readonly [];
            readonly name: "symbol";
            readonly outputs: readonly [{
                readonly name: "";
                readonly type: "string";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: false;
            readonly inputs: readonly [{
                readonly name: "_to";
                readonly type: "address";
            }, {
                readonly name: "_value";
                readonly type: "uint256";
            }];
            readonly name: "transfer";
            readonly outputs: readonly [{
                readonly name: "success";
                readonly type: "bool";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: false;
            readonly inputs: readonly [{
                readonly name: "_spender";
                readonly type: "address";
            }, {
                readonly name: "_value";
                readonly type: "uint256";
            }, {
                readonly name: "_extraData";
                readonly type: "bytes";
            }];
            readonly name: "approveAndCall";
            readonly outputs: readonly [{
                readonly name: "success";
                readonly type: "bool";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly constant: true;
            readonly inputs: readonly [{
                readonly name: "_owner";
                readonly type: "address";
            }, {
                readonly name: "_spender";
                readonly type: "address";
            }];
            readonly name: "allowance";
            readonly outputs: readonly [{
                readonly name: "remaining";
                readonly type: "uint256";
            }];
            readonly payable: false;
            readonly type: "function";
        }, {
            readonly inputs: readonly [{
                readonly name: "_initialAmount";
                readonly type: "uint256";
            }, {
                readonly name: "_tokenName";
                readonly type: "string";
            }, {
                readonly name: "_decimalUnits";
                readonly type: "uint8";
            }, {
                readonly name: "_tokenSymbol";
                readonly type: "string";
            }];
            readonly type: "constructor";
        }, {
            readonly payable: false;
            readonly type: "fallback";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "_from";
                readonly type: "address";
            }, {
                readonly indexed: true;
                readonly name: "_to";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "_value";
                readonly type: "uint256";
            }];
            readonly name: "Transfer";
            readonly type: "event";
        }, {
            readonly anonymous: false;
            readonly inputs: readonly [{
                readonly indexed: true;
                readonly name: "_owner";
                readonly type: "address";
            }, {
                readonly indexed: true;
                readonly name: "_spender";
                readonly type: "address";
            }, {
                readonly indexed: false;
                readonly name: "_value";
                readonly type: "uint256";
            }];
            readonly name: "Approval";
            readonly type: "event";
        }, {
            readonly constant: false;
            readonly inputs: readonly [{
                readonly name: "spender";
                readonly type: "address";
            }, {
                readonly name: "addedValue";
                readonly type: "uint256";
            }];
            readonly name: "increaseAllowance";
            readonly outputs: readonly [{
                readonly name: "success";
                readonly type: "bool";
            }];
            readonly payable: false;
            readonly stateMutability: "nonpayable";
            readonly type: "function";
        }];
    };
    readonly '0xf98864DA30a5bd657B13e70A57f5718aBf7BAB31': {
        readonly methods: {
            readonly stake: {
                readonly name: "buyVoucher";
                readonly params: readonly ["address", "amount", "heimdallFee", "accept", "signerPubkey"];
            };
            readonly abi: readonly [{
                readonly anonymous: false;
                readonly inputs: readonly [{
                    readonly indexed: true;
                    readonly internalType: "address";
                    readonly name: "owner";
                    readonly type: "address";
                }, {
                    readonly indexed: true;
                    readonly internalType: "address";
                    readonly name: "spender";
                    readonly type: "address";
                }, {
                    readonly indexed: false;
                    readonly internalType: "uint256";
                    readonly name: "value";
                    readonly type: "uint256";
                }];
                readonly name: "Approval";
                readonly type: "event";
            }, {
                readonly anonymous: false;
                readonly inputs: readonly [{
                    readonly indexed: true;
                    readonly internalType: "address";
                    readonly name: "previousOwner";
                    readonly type: "address";
                }, {
                    readonly indexed: true;
                    readonly internalType: "address";
                    readonly name: "newOwner";
                    readonly type: "address";
                }];
                readonly name: "OwnershipTransferred";
                readonly type: "event";
            }, {
                readonly anonymous: false;
                readonly inputs: readonly [{
                    readonly indexed: true;
                    readonly internalType: "address";
                    readonly name: "from";
                    readonly type: "address";
                }, {
                    readonly indexed: true;
                    readonly internalType: "address";
                    readonly name: "to";
                    readonly type: "address";
                }, {
                    readonly indexed: false;
                    readonly internalType: "uint256";
                    readonly name: "value";
                    readonly type: "uint256";
                }];
                readonly name: "Transfer";
                readonly type: "event";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "activeAmount";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "owner";
                    readonly type: "address";
                }, {
                    readonly internalType: "address";
                    readonly name: "spender";
                    readonly type: "address";
                }];
                readonly name: "allowance";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "spender";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "value";
                    readonly type: "uint256";
                }];
                readonly name: "approve";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "owner";
                    readonly type: "address";
                }];
                readonly name: "balanceOf";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "_amount";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "_minSharesToMint";
                    readonly type: "uint256";
                }];
                readonly name: "buyVoucher";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "amountToDeposit";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "commissionRate_deprecated";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "spender";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "subtractedValue";
                    readonly type: "uint256";
                }];
                readonly name: "decreaseAllowance";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "delegation";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "token";
                    readonly type: "address";
                }, {
                    readonly internalType: "address payable";
                    readonly name: "destination";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "amount";
                    readonly type: "uint256";
                }];
                readonly name: "drain";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "eventsHub";
                readonly outputs: readonly [{
                    readonly internalType: "contract EventsHub";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "exchangeRate";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "user";
                    readonly type: "address";
                }];
                readonly name: "getLiquidRewards";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "getRewardPerShare";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "user";
                    readonly type: "address";
                }];
                readonly name: "getTotalStake";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
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
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly name: "initalRewardPerShare";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "_validatorId";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "address";
                    readonly name: "_stakingLogger";
                    readonly type: "address";
                }, {
                    readonly internalType: "address";
                    readonly name: "_stakeManager";
                    readonly type: "address";
                }];
                readonly name: "initialize";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "isOwner";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "lastCommissionUpdate_deprecated";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [];
                readonly name: "lock";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "locked";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "user";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "amount";
                    readonly type: "uint256";
                }];
                readonly name: "migrateIn";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "user";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "amount";
                    readonly type: "uint256";
                }];
                readonly name: "migrateOut";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "minAmount";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "owner";
                readonly outputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [];
                readonly name: "renounceOwnership";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [];
                readonly name: "restake";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "rewardPerShare";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "claimAmount";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "maximumSharesToBurn";
                    readonly type: "uint256";
                }];
                readonly name: "sellVoucher";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "claimAmount";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "maximumSharesToBurn";
                    readonly type: "uint256";
                }];
                readonly name: "sellVoucher_new";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "validatorStake";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "delegatedAmount";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "totalAmountToSlash";
                    readonly type: "uint256";
                }];
                readonly name: "slash";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "stakeManager";
                readonly outputs: readonly [{
                    readonly internalType: "contract IStakeManager";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "stakingLogger";
                readonly outputs: readonly [{
                    readonly internalType: "contract StakingInfo";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "totalStake_deprecated";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "totalSupply";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "to";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "value";
                    readonly type: "uint256";
                }];
                readonly name: "transfer";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "from";
                    readonly type: "address";
                }, {
                    readonly internalType: "address";
                    readonly name: "to";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "value";
                    readonly type: "uint256";
                }];
                readonly name: "transferFrom";
                readonly outputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "";
                    readonly type: "bool";
                }];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "newOwner";
                    readonly type: "address";
                }];
                readonly name: "transferOwnership";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly name: "unbondNonces";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "";
                    readonly type: "address";
                }];
                readonly name: "unbonds";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "shares";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "withdrawEpoch";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [{
                    readonly internalType: "address";
                    readonly name: "";
                    readonly type: "address";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly name: "unbonds_new";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "shares";
                    readonly type: "uint256";
                }, {
                    readonly internalType: "uint256";
                    readonly name: "withdrawEpoch";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [];
                readonly name: "unlock";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [];
                readonly name: "unstakeClaimTokens";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "unbondNonce";
                    readonly type: "uint256";
                }];
                readonly name: "unstakeClaimTokens_new";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [{
                    readonly internalType: "bool";
                    readonly name: "_delegation";
                    readonly type: "bool";
                }];
                readonly name: "updateDelegation";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "validatorId";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "validatorRewards_deprecated";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "withdrawExchangeRate";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "withdrawPool";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }, {
                readonly constant: false;
                readonly inputs: readonly [];
                readonly name: "withdrawRewards";
                readonly outputs: readonly [];
                readonly payable: false;
                readonly stateMutability: "nonpayable";
                readonly type: "function";
            }, {
                readonly constant: true;
                readonly inputs: readonly [];
                readonly name: "withdrawShares";
                readonly outputs: readonly [{
                    readonly internalType: "uint256";
                    readonly name: "";
                    readonly type: "uint256";
                }];
                readonly payable: false;
                readonly stateMutability: "view";
                readonly type: "function";
            }];
        };
    };
    readonly '0x85627d71921AE25769f5370E482AdA5E1e418d37': {
        readonly methods: {
            readonly getUnclaimedEpochs: {
                readonly name: "getEpochsWithUnclaimedRewards";
                readonly params: readonly ["address"];
            };
            readonly getRewardsState: {
                readonly name: "getStateOfRewards";
                readonly params: readonly ["address", "epoch"];
            };
            readonly claim: {
                readonly name: "claim";
                readonly params: readonly ["address", "address", "epochs", "wrap"];
            };
        };
        readonly abi: readonly [{
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
    };
    readonly '0x1d80c49bbbcd1c0911346656b529df9e5c2f783d': {
        readonly methods: {
            readonly stake: {
                readonly name: "deposit";
                readonly params: readonly [];
            };
            readonly unstake: {
                readonly name: "withdraw";
                readonly params: readonly ["amount"];
            };
            readonly delegate: {
                readonly name: "delegate";
                readonly params: readonly ["address", "bips"];
            };
            readonly undelegate: {
                readonly name: "undelegateAll";
                readonly params: readonly [];
            };
        };
        readonly abi: readonly [{
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
    };
    readonly '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': {
        readonly methods: {
            readonly stake: {
                readonly name: "submit";
                readonly params: readonly ["address"];
            };
        };
        readonly abi: readonly [{
            readonly constant: true;
            readonly name: "submit";
            readonly inputs: readonly [{
                readonly name: "_referral";
                readonly type: "address";
            }];
            readonly outputs: readonly [{
                readonly name: "shares";
                readonly type: "uint256";
            }];
            readonly payable: false;
            readonly stateMutability: "view";
            readonly type: "function";
        }];
    };
};
export default _default;

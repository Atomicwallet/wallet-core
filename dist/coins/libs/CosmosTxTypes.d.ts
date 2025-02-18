export function msgSend({ fromAddress, toAddress, amount, fee, gas, memo, denom }: {
    fromAddress: any;
    toAddress: any;
    amount: any;
    fee: any;
    gas: any;
    memo: any;
    denom?: string | undefined;
}): {
    msg: {
        type: string;
        value: {
            from_address: any;
            to_address: any;
            amount: {
                denom: string;
                amount: any;
            }[];
        };
    }[];
    fee: {
        amount: {
            denom: string;
            amount: any;
        }[];
        gas: any;
    };
    signatures: null;
    memo: any;
};
export function msgDelegate({ delegatorAddress, validatorAddress, amount, fee, gas, memo, denom }: {
    delegatorAddress: any;
    validatorAddress: any;
    amount: any;
    fee: any;
    gas: any;
    memo: any;
    denom?: string | undefined;
}): {
    msg: {
        type: string;
        value: {
            delegator_address: any;
            validator_address: any;
            amount: {
                denom: string;
                amount: any;
            };
        };
    }[];
    fee: {
        amount: {
            denom: string;
            amount: any;
        }[];
        gas: any;
    };
    signatures: null;
    memo: any;
};
export function msgUndelegate({ delegatorAddress, validatorAddress, amount, fee, gas, memo, denom, }: {
    delegatorAddress: any;
    validatorAddress: any;
    amount: any;
    fee: any;
    gas: any;
    memo?: string | undefined;
    denom?: string | undefined;
}): {
    msg: {
        type: string;
        value: {
            delegator_address: any;
            validator_address: any;
            amount: {
                denom: string;
                amount: any;
            };
        };
    }[];
    fee: {
        amount: {
            denom: string;
            amount: any;
        }[];
        gas: any;
    };
    signatures: null;
    memo: string;
};
export function msgRedelegate({ delegatorAddress, validatorSrcAddress, validatorDstAddress, amount, fee, gas, memo, denom, }: {
    delegatorAddress: any;
    validatorSrcAddress: any;
    validatorDstAddress: any;
    amount: any;
    fee: any;
    gas: any;
    memo: any;
    denom?: string | undefined;
}): {
    msg: {
        type: string;
        value: {
            delegator_address: any;
            validator_src_address: any;
            validator_dst_address: any;
            amount: {
                denom: string;
                amount: any;
            };
        };
    }[];
    fee: {
        amount: {
            denom: string;
            amount: any;
        }[];
        gas: any;
    };
    signatures: null;
    memo: any;
};
declare const _default: {
    'cosmos-sdk/MsgSend': ({ fromAddress, toAddress, amount, fee, gas, memo, denom }: {
        fromAddress: any;
        toAddress: any;
        amount: any;
        fee: any;
        gas: any;
        memo: any;
        denom?: string | undefined;
    }) => {
        msg: {
            type: string;
            value: {
                from_address: any;
                to_address: any;
                amount: {
                    denom: string;
                    amount: any;
                }[];
            };
        }[];
        fee: {
            amount: {
                denom: string;
                amount: any;
            }[];
            gas: any;
        };
        signatures: null;
        memo: any;
    };
    'cosmos-sdk/MsgDelegate': ({ delegatorAddress, validatorAddress, amount, fee, gas, memo, denom }: {
        delegatorAddress: any;
        validatorAddress: any;
        amount: any;
        fee: any;
        gas: any;
        memo: any;
        denom?: string | undefined;
    }) => {
        msg: {
            type: string;
            value: {
                delegator_address: any;
                validator_address: any;
                amount: {
                    denom: string;
                    amount: any;
                };
            };
        }[];
        fee: {
            amount: {
                denom: string;
                amount: any;
            }[];
            gas: any;
        };
        signatures: null;
        memo: any;
    };
    'cosmos-sdk/MsgUndelegate': ({ delegatorAddress, validatorAddress, amount, fee, gas, memo, denom, }: {
        delegatorAddress: any;
        validatorAddress: any;
        amount: any;
        fee: any;
        gas: any;
        memo?: string | undefined;
        denom?: string | undefined;
    }) => {
        msg: {
            type: string;
            value: {
                delegator_address: any;
                validator_address: any;
                amount: {
                    denom: string;
                    amount: any;
                };
            };
        }[];
        fee: {
            amount: {
                denom: string;
                amount: any;
            }[];
            gas: any;
        };
        signatures: null;
        memo: string;
    };
    'cosmos-sdk/MsgBeginRedelegate': ({ delegatorAddress, validatorSrcAddress, validatorDstAddress, amount, fee, gas, memo, denom, }: {
        delegatorAddress: any;
        validatorSrcAddress: any;
        validatorDstAddress: any;
        amount: any;
        fee: any;
        gas: any;
        memo: any;
        denom?: string | undefined;
    }) => {
        msg: {
            type: string;
            value: {
                delegator_address: any;
                validator_src_address: any;
                validator_dst_address: any;
                amount: {
                    denom: string;
                    amount: any;
                };
            };
        }[];
        fee: {
            amount: {
                denom: string;
                amount: any;
            }[];
            gas: any;
        };
        signatures: null;
        memo: any;
    };
};
export default _default;

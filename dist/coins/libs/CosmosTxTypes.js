import { ATOM_MSG_TYPES } from '../../utils/index.js';
export const msgSend = ({ fromAddress, toAddress, amount, fee, gas, memo, denom = 'uatom' }) => ({
    msg: [
        {
            type: ATOM_MSG_TYPES.Send,
            value: {
                from_address: fromAddress,
                to_address: toAddress,
                amount: [{ denom, amount }],
            },
        },
    ],
    fee: {
        amount: [{ denom, amount: fee }],
        gas,
    },
    signatures: null,
    memo,
});
export const msgDelegate = ({ delegatorAddress, validatorAddress, amount, fee, gas, memo, denom = 'uatom' }) => ({
    msg: [
        {
            type: ATOM_MSG_TYPES.Delegate,
            value: {
                delegator_address: delegatorAddress,
                validator_address: validatorAddress,
                amount: {
                    denom,
                    amount,
                },
            },
        },
    ],
    fee: {
        amount: [
            {
                denom,
                amount: fee,
            },
        ],
        gas,
    },
    signatures: null,
    memo,
});
export const msgUndelegate = ({ delegatorAddress, validatorAddress, amount, fee, gas, memo = '', denom = 'uatom', }) => ({
    msg: [
        {
            type: ATOM_MSG_TYPES.Undelegate,
            value: {
                delegator_address: delegatorAddress,
                validator_address: validatorAddress,
                amount: {
                    denom,
                    amount,
                },
            },
        },
    ],
    fee: {
        amount: [
            {
                denom,
                amount: fee,
            },
        ],
        gas,
    },
    signatures: null,
    memo,
});
export const msgRedelegate = ({ delegatorAddress, validatorSrcAddress, validatorDstAddress, amount, fee, gas, memo, denom = 'uatom', }) => ({
    msg: [
        {
            type: ATOM_MSG_TYPES.Redelegate,
            value: {
                delegator_address: delegatorAddress,
                validator_src_address: validatorSrcAddress,
                validator_dst_address: validatorDstAddress,
                amount: {
                    denom,
                    amount,
                },
            },
        },
    ],
    fee: {
        amount: [
            {
                denom,
                amount: fee,
            },
        ],
        gas,
    },
    signatures: null,
    memo,
});
export default {
    'cosmos-sdk/MsgSend': msgSend,
    'cosmos-sdk/MsgDelegate': msgDelegate,
    'cosmos-sdk/MsgUndelegate': msgUndelegate,
    'cosmos-sdk/MsgBeginRedelegate': msgRedelegate,
};
//# sourceMappingURL=CosmosTxTypes.js.map
export default [
    {
        name: 'approve',
        inputs: [
            {
                name: 'spender',
                type: 'address',
            },
            {
                name: 'amount',
                type: 'uint256',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        name: 'balanceOf',
        inputs: [
            {
                name: 'account',
                type: 'address',
            },
        ],
        outputs: [
            {
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        name: 'delegate',
        inputs: [
            {
                internalType: 'address',
                name: '_to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_bips',
                type: 'uint256',
            },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        name: 'delegatesOf',
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
        ],
        outputs: [
            {
                internalType: 'address[]',
                name: '_delegateAddresses',
                type: 'address[]',
            },
            {
                internalType: 'uint256[]',
                name: '_bips',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256',
                name: '_count',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_delegationMode',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        name: 'delegatesOfAt',
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_blockNumber',
                type: 'uint256',
            },
        ],
        outputs: [
            {
                internalType: 'address[]',
                name: '_delegateAddresses',
                type: 'address[]',
            },
            {
                internalType: 'uint256[]',
                name: '_bips',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256',
                name: '_count',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_delegationMode',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        name: 'delegationModeOf',
        inputs: [
            {
                internalType: 'address',
                name: '_who',
                type: 'address',
            },
        ],
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        name: 'deposit',
        inputs: [],
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        name: 'depositTo',
        inputs: [
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
            },
        ],
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes4',
                name: '_selector',
                type: 'bytes4',
            },
        ],
        name: 'executeGovernanceCall',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'governance',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'governanceSettings',
        outputs: [
            {
                internalType: 'contract IGovernanceSettings',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'governanceVotePower',
        outputs: [
            {
                internalType: 'contract IGovernanceVotePower',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'addedValue',
                type: 'uint256',
            },
        ],
        name: 'increaseAllowance',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_initialGovernance',
                type: 'address',
            },
        ],
        name: 'initialise',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'productionMode',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'readVotePowerContract',
        outputs: [
            {
                internalType: 'contract IVPContractEvents',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_who',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_blockNumber',
                type: 'uint256',
            },
        ],
        name: 'revokeDelegationAt',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_cleanerContract',
                type: 'address',
            },
        ],
        name: 'setCleanerContract',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_blockNumber',
                type: 'uint256',
            },
        ],
        name: 'setCleanupBlockNumber',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalVotePower',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'transfer',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'undelegateAll',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address[]',
                name: '_delegateAddresses',
                type: 'address[]',
            },
        ],
        name: 'undelegateAllExplicit',
        outputs: [
            {
                internalType: 'uint256',
                name: '_remainingDelegation',
                type: 'uint256',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_from',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_to',
                type: 'address',
            },
        ],
        name: 'votePowerFromTo',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
        ],
        name: 'votePowerOf',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_owner',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_blockNumber',
                type: 'uint256',
            },
        ],
        name: 'votePowerOfAtIgnoringRevocation',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
//# sourceMappingURL=WFLR.js.map
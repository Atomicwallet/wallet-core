export default [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_executors',
        type: 'address[]',
      },
    ],
    name: 'setClaimExecutors',
    outputs: [],
    stateMutability: 'payable',
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
    name: 'claimExecutors',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

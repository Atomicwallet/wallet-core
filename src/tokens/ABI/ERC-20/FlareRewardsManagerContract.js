export default [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_beneficiary',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_rewardEpoch',
        type: 'uint256',
      },
    ],
    name: 'getStateOfRewards',
    outputs: [
      {
        internalType: 'address[]',
        name: '_dataProviders',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '_rewardAmounts',
        type: 'uint256[]',
      },
      {
        internalType: 'bool[]',
        name: '_claimed',
        type: 'bool[]',
      },
      {
        internalType: 'bool',
        name: '_claimable',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_rewardOwner',
        type: 'address',
      },
      {
        internalType: 'address payable',
        name: '_recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_rewardEpoch',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: '_wrap',
        type: 'bool',
      },
    ],
    name: 'claim',
    outputs: [
      {
        internalType: 'uint256',
        name: '_rewardAmount',
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
        name: '_beneficiary',
        type: 'address',
      },
    ],
    name: 'getEpochsWithUnclaimedRewards',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '_epochIds',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  {
    inputs: [],
    name: 'newFtsoRewardManager',
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
    name: 'claimSetupManager',
    outputs: [
      {
        internalType: 'contract IIClaimSetupManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

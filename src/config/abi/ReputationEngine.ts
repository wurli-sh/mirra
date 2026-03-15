export const ReputationEngineAbi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalTrades',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'winRate',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'int256',
        name: 'totalPnl',
        type: 'int256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'score',
        type: 'uint256',
      },
    ],
    name: 'ReputationUpdated',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'authorized',
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
    inputs: [
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
    ],
    name: 'getScore',
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
        name: 'leader',
        type: 'address',
      },
    ],
    name: 'getStats',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'totalTrades',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'profitableTrades',
            type: 'uint256',
          },
          {
            internalType: 'int256',
            name: 'totalPnlSTT',
            type: 'int256',
          },
          {
            internalType: 'uint256',
            name: 'totalVolumeSTT',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'score',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'lastTradeBlock',
            type: 'uint256',
          },
        ],
        internalType: 'struct IReputationEngine.LeaderStats',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
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
    inputs: [
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        internalType: 'int256',
        name: 'pnl',
        type: 'int256',
      },
    ],
    name: 'recordClose',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'volumeSTT',
        type: 'uint256',
      },
    ],
    name: 'recordTrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'isAuthorized',
        type: 'bool',
      },
    ],
    name: 'setAuthorized',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'stats',
    outputs: [
      {
        internalType: 'uint256',
        name: 'totalTrades',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'profitableTrades',
        type: 'uint256',
      },
      {
        internalType: 'int256',
        name: 'totalPnlSTT',
        type: 'int256',
      },
      {
        internalType: 'uint256',
        name: 'totalVolumeSTT',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'score',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lastTradeBlock',
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
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

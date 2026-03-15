export const FollowerVaultAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_leaderRegistry',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_baseToken',
        type: 'address',
      },
    ],
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
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Deposited',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'returnedSTT',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'reason',
        type: 'string',
      },
    ],
    name: 'EmergencyClosed',
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
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'FeesClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'depositedSTT',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'maxPerTrade',
        type: 'uint256',
      },
    ],
    name: 'Followed',
    type: 'event',
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
        name: 'follower',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'returnedSTT',
        type: 'uint256',
      },
    ],
    name: 'Unfollowed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Withdrawn',
    type: 'event',
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
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'accrueFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'baseToken',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimFees',
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
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
    ],
    name: 'emergencyClose',
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
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxPerTrade',
        type: 'uint256',
      },
      {
        internalType: 'uint16',
        name: 'maxSlippageBps',
        type: 'uint16',
      },
      {
        internalType: 'uint256',
        name: 'stopLossSTT',
        type: 'uint256',
      },
    ],
    name: 'follow',
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
    ],
    name: 'getFollowerCount',
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
      {
        internalType: 'uint256',
        name: 'offset',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'limit',
        type: 'uint256',
      },
    ],
    name: 'getFollowers',
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
  {
    inputs: [
      {
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
    ],
    name: 'getPosition',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'follower',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'leader',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'depositedSTT',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPerTrade',
            type: 'uint256',
          },
          {
            internalType: 'uint16',
            name: 'maxSlippageBps',
            type: 'uint16',
          },
          {
            internalType: 'uint256',
            name: 'stopLossSTT',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'active',
            type: 'bool',
          },
        ],
        internalType: 'struct IFollowerVault.FollowPosition',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'leaderFollowers',
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
    name: 'leaderRegistry',
    outputs: [
      {
        internalType: 'contract ILeaderRegistry',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mirrorExecutor',
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
        name: '',
        type: 'address',
      },
    ],
    name: 'pendingFees',
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
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'positions',
    outputs: [
      {
        internalType: 'address',
        name: 'follower',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'depositedSTT',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxPerTrade',
        type: 'uint256',
      },
      {
        internalType: 'uint16',
        name: 'maxSlippageBps',
        type: 'uint16',
      },
      {
        internalType: 'uint256',
        name: 'stopLossSTT',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'active',
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
        name: 'follower',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'leader',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'pullTokens',
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
    inputs: [],
    name: 'riskGuardian',
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
        name: '_mirrorExecutor',
        type: 'address',
      },
    ],
    name: 'setMirrorExecutor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_riskGuardian',
        type: 'address',
      },
    ],
    name: 'setRiskGuardian',
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
    name: 'totalFollowingSTT',
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
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
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
    ],
    name: 'unfollow',
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
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

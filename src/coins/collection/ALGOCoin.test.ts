import { generateWalletTests } from '@/__tests__/crypto/crypto.utils';
import { createCoin } from '@/coins';
import ALGOCoin from '@/coins/collection/ALGOCoin';
import type { CoinDataConfig } from '@/coins/createCoin';
import { getWalletConfig } from '@/utils';

const id = 'ALGO';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(ALGOCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

// @ts-expect-error typ
jest.spyOn(wallet, 'getLatestBlock').mockReturnValue({
  'consensus-version':
    'https://github.com/algorandfoundation/specs/tree/925a46433742afb0b51bb939354bd907fa88bf95',
  fee: 0,
  'genesis-hash': 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  'genesis-id': 'mainnet-v1.0',
  'last-round': 46037800,
  'min-fee': 1000,
});

generateWalletTests(wallet);

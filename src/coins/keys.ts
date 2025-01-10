import { type Coin } from 'src/abstract';
import type { IKeys, IKeysObject } from 'src/utils';

const generateKeys = async (wallet: Coin, { seed, phrase }: IKeys): Promise<IKeysObject> => {
  const keysObject = await wallet.loadWallet(seed, phrase);

  return keysObject as Promise<IKeysObject>;
};

const loadKeys = async (
  wallet: Coin,
  keys: { address: string; privateKey: string },
  { seed, phrase }: IKeys,
): Promise<unknown> => {
  let isWalletLoadRequired = false;

  if (keys.address) {
    wallet.setAddress(keys.address);
  } else {
    isWalletLoadRequired = true;
  }

  if (keys.privateKey) {
    try {
      wallet.setPrivateKey(keys.privateKey, phrase);
    } catch (error) {
      isWalletLoadRequired = true;
    }
  } else {
    isWalletLoadRequired = true;
  }

  if (isWalletLoadRequired) {
    const genKeys = await generateKeys(wallet, { seed, phrase });

    return { ...genKeys, ...keys };
  }

  return keys;
};

export { generateKeys, loadKeys };

import {
  mnemonicPhrasesList,
  mnemonicMappingKeys,
} from '../fixtures/common.fixture';
import type { Coin } from '@/abstract';
import { initializeMnemonic } from '@/utils';

export function generateWalletTests(wallet: Coin) {
  describe(`Generate keys from mnemonics`, () => {
    test.each(mnemonicPhrasesList)(
      `Generate keys for ${wallet.ticker}`,
      async (phrase) => {
        const { seed, phrase: mnemonicPhrase } =
          await initializeMnemonic(phrase);
        const keys = await wallet.loadWallet(seed, mnemonicPhrase);

        const { id } = wallet;

        const mapping = mnemonicMappingKeys[phrase]?.[id];
        const address = mapping?.address;
        const pk = mapping?.privateKey;

        expect(pk).toBeDefined();

        if (id !== 'EOS') {
          expect(address).toBeDefined();
          expect(wallet.address).toBeDefined();
          expect(wallet.address).toBe(address);
        }

        // @ts-expect-error privateKey types can differs
        expect(keys.privateKey).toStrictEqual(pk);
      },
    );
  });
}

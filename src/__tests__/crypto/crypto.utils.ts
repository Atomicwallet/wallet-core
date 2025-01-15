import type { Coin, RawTxBinary } from 'src/abstract';
import { initializeMnemonic } from 'src/utils';

import { generateMockUtxo, mnemonicPhrasesList, mnemonicMappingKeys } from '../fixtures/common.fixture';

function isJson(value: string | RawTxBinary): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
}

export function generateWalletTests(wallet: Coin) {
  const { id } = wallet;

  describe(`Generate keys and signed tx`, () => {
    test.each(mnemonicPhrasesList)(`Generate keys for ${wallet.ticker}`, async (phrase) => {
      const { seed, phrase: mnemonicPhrase } = await initializeMnemonic(phrase);
      const keys = await wallet.loadWallet(seed, mnemonicPhrase);
      const mapping = mnemonicMappingKeys[phrase]?.[id];
      const address = mapping?.address;
      const pk = mapping?.privateKey;

      expect(pk).toBeDefined();

      // EOS does not have address before activation process
      if (id !== 'EOS') {
        expect(address).toBeDefined();
        expect(wallet.address).toBeDefined();
        expect(wallet.address).toEqual(address);
        expect(wallet.address).not.toEqual(pk);
      } else {
        // @ts-expect-error eos specific keytype
        keys.privateKey = JSON.parse(keys.privateKey);
      }

      // @ts-expect-error privateKey types could differ
      expect(keys.privateKey).toStrictEqual(pk);
    });
  });

  describe('Create signed tx', () => {
    test.each(mnemonicPhrasesList)(
      `Generate signed tx for ${wallet.ticker}`,
      async (phrase) => {
        if (id === 'EOS') {
          // eos tx sign should be defined in instance first
          return;
        }

        const mappingKeyElement = mnemonicMappingKeys[phrase]?.[id];

        if (!mappingKeyElement) {
          throw new Error('Failed to map keys');
        }

        const { address, privateKey, tx } = mappingKeyElement;

        await wallet.setPrivateKey(privateKey as string, phrase);
        wallet.setAddress(address);

        const amount = wallet.toMinimalUnit('42');
        const utxo = generateMockUtxo(wallet.address, amount);

        if (wallet.getScriptPubKey) {
          for (const out of utxo) {
            out.script = (await wallet.getScriptPubKey()) as string;
          }
        }

        if (wallet.id !== 'ADA') {
          // @ts-expect-error typ
          jest.spyOn(wallet, 'getUnspentOutputs').mockReturnValue(utxo);
        }

        let signedTx = await wallet.createTransaction({
          amount,
          address: wallet.address,
        });

        if (signedTx instanceof Object && !(signedTx instanceof Uint8Array)) {
          signedTx = JSON.parse(JSON.stringify(signedTx));
        } else if (isJson(signedTx)) {
          // @ts-expect-error typ
          signedTx = JSON.parse(signedTx);
        } else if (signedTx instanceof Uint8Array) {
          signedTx = Array.from(signedTx);
        }

        // console.log(wallet.address, '\n', JSON.stringify(signedTx));

        expect(signedTx).toStrictEqual(tx);
      },
      30000,
    );
  });
}

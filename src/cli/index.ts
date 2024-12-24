import { program } from 'commander';

import { createWallets } from './coins';
import { generateKeys } from './keys';
import { initializeMnemonic } from './mnemonic';
import type { IKeysObject } from './types';

program.name('atomic-core-cli').description('atomic-core CLI').version('1.0.0');

program
  .command('mnemonic')
  .description('Generates new mnemonic, or restore from phrase')
  .option('-p, --phrase <phrase>', 'Generate mnemonic from phrase')
  .action(async (options: { phrase?: string }): Promise<void> => {
    const mnemonic = await initializeMnemonic(options.phrase);

    console.log({
      phrase: mnemonic.phrase,
      seed: mnemonic.seed.toString('hex'),
    });
  });

program
  .command('keys')
  .description('Generates key-pairs')
  .option('-p, --phrase <phrase>', 'Generate key-pairs from mnemonic')
  .action(async (options: { phrase?: string }): Promise<void> => {
    console.log('Init mnemonic...');
    const mnemonic = await initializeMnemonic(options.phrase);

    console.log('OK');

    console.log('Create wallets...');
    const wallets = await createWallets();

    console.log('OK');

    console.log('Generate key pairs...');
    const promises = await Promise.allSettled(
      wallets.map(async (wallet) => generateKeys(wallet, mnemonic)),
    );

    const keys = promises
      .filter(
        (promise): promise is PromiseFulfilledResult<IKeysObject> =>
          promise.status === 'fulfilled',
      )
      .map((fulfilled) => fulfilled?.value)
      .filter(Boolean);

    console.log(keys);
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

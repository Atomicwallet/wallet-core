import { program } from 'commander';
import { RawTxHex, RawTxObject, RawTxBinary } from 'src/abstract';
import { createWallets, generateKeys } from 'src/coins';
import { initializeMnemonic, type IKeysObject } from 'src/utils';

program.name('atomic-core-adapters-cli').description('atomic-core-adapters CLI').version('1.0.0');

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
    const promises = await Promise.allSettled(wallets.map(async (wallet) => generateKeys(wallet, mnemonic)));

    const keys = promises
      .filter((promise): promise is PromiseFulfilledResult<IKeysObject> => promise.status === 'fulfilled')
      .map((fulfilled) => fulfilled?.value)
      .filter(Boolean);

    console.log('OK');
    console.log(keys);
  });

program
  .command('tx')
  .description('Create signed transaction')
  .option('-p, --phrase <phrase>', 'Generate key-pairs from mnemonic')
  .option('-w, --wallet <wallet>', 'wallet ticker, e.g. BTC')
  .option('-a, --amount <amount>', 'Amount, e.g. 1.35')
  .option('-r, --recipient <recepient>', 'Recipient address')
  .option('-m, --memo <memo>', 'Memo info')
  .action(
    async (options: {
      wallet: string;
      amount: string;
      recipient: string;
      phrase?: string;
      memo?: string;
    }): Promise<void> => {
      console.log('Init mnemonic...');
      const mnemonic = await initializeMnemonic(options.phrase);

      console.log('OK');

      console.log(`Create ${options.wallet} wallet...`);
      const wallets = await createWallets({ id: options.wallet });
      const wallet = wallets.find((wallet) => wallet.id.toLowerCase() === options.wallet.toLowerCase());

      if (!wallet) {
        throw new Error(`Failed to create ${options.wallet}, not supported`);
      }
      console.log('OK');

      const validAddress = (await wallet.validateAddress(options.recipient)) as unknown as boolean;

      if (!validAddress) {
        throw new Error(`Invalid recipient address: ${options.recipient}`);
      }

      console.log('Generate key pairs...');
      await Promise.allSettled(wallets.map(async (wallet) => generateKeys(wallet, mnemonic)));
      console.log('OK');

      console.log('Create transaction...');
      const tx = await wallet
        .createTransaction({
          amount: wallet.toMinimalUnit(options.amount),
          address: options.recipient,
          memo: options.memo,
        })
        .catch((err) => {
          console.log('Failed to create transaction...\n', err.message);
        });

      if (tx) {
        console.log(`Signed tx:\n${tx}`);
      }
    },
  );

program
  .command('submitTx')
  .description('submit signed transaction')
  .option('-p, --phrase <phrase>', 'Generate key-pairs from mnemonic')
  .option('-w, --wallet <wallet>', 'wallet ticker, e.g. BTC')
  .option('-t, --tx <tx>', 'signed tx hex')
  .action(
    async (options: { phrase: string; wallet: string; tx: RawTxHex | RawTxBinary | RawTxObject }): Promise<void> => {
      console.log('Init mnemonic...');
      const mnemonic = await initializeMnemonic(options.phrase);

      console.log('OK');

      console.log(`Create ${options.wallet} wallet...`);
      const wallets = await createWallets({ id: options.wallet });
      const wallet = wallets.find((wallet) => wallet.id.toLowerCase() === options.wallet.toLowerCase());

      if (!wallet) {
        throw new Error(`Failed to create ${options.wallet}, not supported`);
      }
      console.log('OK');

      console.log('Generate key pairs...');
      await Promise.allSettled(wallets.map(async (wallet) => generateKeys(wallet, mnemonic)));
      console.log('OK');

      console.log('Submit transaction...');
      const submit = await wallet.sendTransaction(options.tx).catch((err) => {
        console.log('Faile to submit transaction...\n', err.message);
      });

      if (submit) {
        console.log(`Submit OK:\n${submit}`);
      }
    },
  );

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

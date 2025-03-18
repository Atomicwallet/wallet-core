import { generateWalletTests } from '../../__tests__/crypto/crypto.utils.js';
import { createCoin } from '../../coins/index.js';
import WAVESCoin from '../../coins/collection/WAVESCoin.js';
import { getWalletConfig } from '../../utils/index.js';
const id = 'WAVES';
const config = getWalletConfig({ id });
if (!config) {
    throw new Error(`Missing ${id} config`);
}
const wallet = createCoin(WAVESCoin, config);
if (!wallet) {
    throw new Error(`Failed to initialize ${id} wallet`);
}
// @ts-expect-error unimplemented in abstract class
const originalSign = wallet.signTransaction.bind(wallet);
// @ts-expect-error mixin overload
jest.spyOn(wallet, 'signTransaction').mockImplementation(async (tx) => {
    tx.timestamp = 1736272374040;
    tx.id = '8Se9QJKXpcZEwLqN5d9VfAWB757rXcoBXZjpi46xpHn7';
    const signed = await originalSign(tx);
    const modified = JSON.parse(signed);
    modified.proofs = [];
    return JSON.stringify(modified);
});
generateWalletTests(wallet);
//# sourceMappingURL=WAVESCoin.test.js.map
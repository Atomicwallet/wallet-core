import { Transaction } from 'hedera-sdk-v2';

import Explorer from '../Explorer';

const HEDERA_SUCCESS_CODE = 22;

/**
 * mainnet address book
 * https://docs.hedera.com/docs/mainnet
 */
class HashnodeExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.node = { [this.config.baseUrl]: this.config.nodeAccount }; // node account id should be defined, e.g `0.0.3`
  }

  getAllowedTickers() {
    return ['HBAR'];
  }

  async getInfo(address) {
    if (!address) {
      throw new Error('[HBAR] HashnodeExplorer: address is not defined');
    }
    const response = await this.wallet.getClient().getAccountBalance(address);

    return {
      balance: response.asTinybar().toString(),
    };
  }

  async sendTransaction({ rawtx, account, privateKey }) {
    if (!rawtx) {
      throw new Error(
        `HBAR: sendTransaction error: incorrect tx: got "${rawtx}" of type ${typeof rawtx}`,
      );
    }
    const tx = Transaction.fromBytes(new Uint8Array(Buffer.from(rawtx, 'hex')));
    const id = await tx.execute(this.wallet.getClient());
    const receipt = await id.getReceipt(this.wallet.getClient());

    if (receipt.status && receipt.status.code !== HEDERA_SUCCESS_CODE) {
      throw new Error(receipt.status);
    }

    const result = {
      txid: id.toString(),
    };

    try {
      result.accountId = receipt.accountId;
    } catch (error) {
      console.warn('[HashnodeExplorer] sendTransaction:', error);
    }

    return result;
  }
}

export default HashnodeExplorer;

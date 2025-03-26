import { Token } from '../abstract';

const solanaWeb3Lib = 'solanaWeb3Lib';

class SOLToken extends Token {
  #parent;
  #address;

  constructor(config, db, configManager) {
    super(config, db, configManager);

    this.mint = config.mint;
    this.#parent = config.parent;

    this.loadAddress();
  }

  async loadAddress() {
    const { PublicKey } = await this.#parent.loadLib(solanaWeb3Lib);

    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const address = PublicKey.findProgramAddressSync(
      [
        new PublicKey(this.#parent.address).toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        new PublicKey(this.mint).toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    )[0];

    this.address = address.toString();
  }

  /**
   * Gets the information about a wallet.
   * @return {Promise<{ balance: string }>} The information data.
   */
  async getInfo() {
    const balance = await this.#parent.getTokenInfo({ mint: this.mint });

    if (balance) {
      this.balance = balance;
    }

    return {
      balance: this.balance,
    };
  }

  /* @TODO DEPRECATED
   * should be used `createTransaction method from Token.js
   * wich proxied to parent `createTransaction
   * */
  async createTransaction({ address, amount }) {
    return {
      mint: this.mint,
      address,
      amount,
      decimals: this.decimal,
      transfer: true,
    };
  }

  set address(val) {
    this.#address = val;
  }

  get address() {
    return this.#address;
  }

  async getTransactions(offset, limit) {
    try {
      const txs = await this.#parent.getTransactions({
        address: this.address,
        offset,
        limit,
      });

      return txs;
    } catch (error) {
      return this.transactions;
    }
  }
}

export default SOLToken;

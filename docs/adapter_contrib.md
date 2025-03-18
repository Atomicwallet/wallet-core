# How to Add a New Adapter

This guide is for contributors who aim to integrate a new cryptocurrency (adapter) into the project. It provides a step-by-step walkthrough for creating, configuring, and testing the adapter. Please follow all instructions and comments carefully to ensure your adapter functions correctly within the system.

## Step 1: Create the Coin Class

1. **Add a new file for your coin:**
   Coin classes are stored in the coins/collections directory. Create a file named after the ticker of the coin, e.g., EXMPLCoin.js.
2. **Implement the coin class:**
   Your new coin class should inherit from the abstract Coin class. Below is an example template with comments and explanations.

### Example: Creating a New Coin Class
```javascript
import BN from 'bn.js';
import { Coin } from 'src/abstract';

// Use appropriate explorer modules for your coin
import Web3Explorer from 'src/explorers/collection/Web3Explorer';

import { LazyLoadedLib, logger } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';

// Optionally include mixins, if relevant
import HasProviders from '../mixins/HasProviders';

// Define coin properties
const NAME = 'Example Coin';
const TICKER = 'EXMPL';

// Define the derivation path. Ensure correctness with SLIP-44: 
// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const DERIVATION = "m/44'/0'/0'/0/0";

// Specify decimal precision
const DECIMAL = 8;

// Define unspendable balance (optional)
// Example: Ripple requires 10 XRP as a permanent reserve
const UNSPENDABLE_BALANCE = '0';

/**
 * @class EXMPLCoin
 */
class EXMPLCoin extends Coin {
  coreLibrary = null;

  /**
   * Constructor for the coin class
   *
   * @param {object} config - Configuration object (e.g., see `src/resources/wallets_fee`)
   * @param {object} db - Database instance
   * @param {object} configManager - Configuration manager
   */
  constructor(config, db, configManager) {
    super(
      {
        ...config,
        name: config.name ?? NAME,
        ticker: config.ticker ?? TICKER,
        decimal: DECIMAL,
        dependencies: {
          [SDK]: new LazyLoadedLib(() => import('example-sdk')), // Load SDK dynamically
        },
      },
      db,
      configManager,
    );

    this.derivation = DERIVATION;

    // Define explorers for interactions like fetching balance or transactions
    this.setExplorersModules([Web3Explorer]);

    this.loadExplorers(config);

    const { feeData, explorers } = config;

    this.setFeeData(feeData);

    const web3Params = explorers.find(({ className }) => className === 'Web3Explorer');
    this.web3BaseUrl = web3Params.baseUrl;

    this.nonce = new this.BN('0');
  }

  /**
   * Initializes the core library (e.g., Web3)
   * @returns {Promise<void>}
   */
  async initCoreLibrary() {
    if (this.coreLibrary) {
      return;
    }

    const { default: Web3 } = await this.loadLib(WEB3_SDK);

    this.coreLibrary = new Web3(this.web3BaseUrl);
  }

  /**
   * Retrieves the initialized core library
   * @returns {Promise<Object>}
   */
  async getCoreLibrary() {
    if (!this.coreLibrary) {
      await this.initCoreLibrary();
    }

    return this.coreLibrary;
  }

  /**
   * Configure fee data (optional)
   * Use to override default fee parameters
   * @param {object} feeData - Fee configuration
   */
  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
  }

  /**
   * Loads a wallet from a seed and mnemonic phrase
   *
   * @param {string} seed - The seed for HD wallet generation
   * @param {string} mnemonic - The mnemonic phrase
   * @returns {Promise<Object>} Wallet details: { privateKey, address, id }
   */
  async loadWallet(seed, mnemonic) {
    const coreLibrary = await this.getCoreLibrary();
    const hdKey = coreLibrary.getHdKey(seed);
    const { privateKey, publicKey } = hdKey.deriveKeyPair();

    this.#privateKey = privateKey;
    this.address = publicKey;

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * Returns the available balance considering unspendable and fee reserves
   * @param {BN} fee - Maximum fee to account for
   * @returns {Promise<string>} Available balance in formatted units
   */
  async availableBalance(fee) {
    if (!this.balance) {
      return '0';
    }

    const maximumFee = fee ? new this.BN(fee) : await this.getFee();
    const availableBalance = new this.BN(this.balance)
      .sub(maximumFee)
      .sub(new this.BN(this.unspendableBalance));

    if (availableBalance.lt(new this.BN(0))) {
      return '0';
    }

    return this.toCurrencyUnit(availableBalance);
  }
}

export default EXMPLCoin;
```

## Step 2: Define Configuration
To enable your new coin adapter, you must define its configuration parameters in src/resources/wallets_fee. This includes fee data, explorers, and additional functionality.

**Example Configuration**

```json
{
  "className": "EXMPLCoin",
  "id": "EXMPL",
  "ticker": "EXMPL",
  "name": "Example Coin",
  "txWebUrl": "https://example.coin.com/transactions/",
  "socket": false,
  "notify": false,
  "feeData": {
    "gasPrice": "1000000000",
    "gasLimit": "50000"
  },
  "explorers": [
    {
      "className": "Web3Explorer",
      "baseUrl": "https://api.example.com",
      "usedFor": ["balance"]
    },
    {
      "className": "Web3Explorer",
      "baseUrl": "https://api.next-example.com",
      "usedFor": ["history", "tx", "send", "staking"]
    }
  ]
}
```

## Step 3: Write Tests
Every adapter must include proper unit tests. Place tests near the class implementation within the same directory (coins/collections). Use the `src/__tests__/crypto` utilities for common test operations.
Fixtures for deterministic testing (e.g., wallets, mnemonic phrases) should be stored in `src/__tests__/fixtures/mnemonic_mapping.json`.

**Example Test Case:**
```typescript 
// EXMPLCoin.test.ts
import { generateWalletTests } from 'src/__tests__/crypto/crypto.utils';
import { createCoin } from 'src/coins';
import EXMPLCoin from 'src/coins/collection/EXMPLCoin';
import type { CoinDataConfig } from 'src/coins/createCoin';
import { getWalletConfig } from 'src/utils';

const id = 'EXMPL';
const config = getWalletConfig({ id });

if (!config) {
  throw new Error(`Missing ${id} config`);
}

const wallet = createCoin(EXMPLCoin, config as CoinDataConfig);

if (!wallet) {
  throw new Error(`Failed to initialize ${id} wallet`);
}

jest.spyOn(wallet, 'getNonce').mockReturnValue(0);

generateWalletTests(wallet);
```

## Step 4: Finalize and Verify
1. **Run Tests:** Make sure all tests pass.
2. **Check Linting:** Use eslint and make sure the code conforms to the project's standards. 
3. **Document:** Verify that your documentation explains how the integration works.

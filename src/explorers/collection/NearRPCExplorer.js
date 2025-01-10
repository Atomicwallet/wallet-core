// docs: https://near.github.io/near-api-js/
import BN from 'bn.js';
import lodash from 'lodash';
import * as nearAPI from 'near-api-js';

// import logger from '../Logger'
import { ExternalError } from '../../errors/index.js';
import { Amount } from '../../utils';
import { EXTERNAL_ERROR } from '../../utils/const';
import Explorer from '../Explorer';

const THROTTLE_INTERVAL = 800;
const ACCOUNT_DOES_NOT_EXIST_ERROR = 'AccountDoesNotExist';
const MIN_DISPLAY_YOCTO = new BN('100');

class NearRPCExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.provider = new nearAPI.providers.JsonRpcProvider(this.config.baseUrl);
  }

  getAllowedTickers() {
    return ['NEAR'];
  }

  async _getNodeConfig() {
    try {
      return this.provider.experimental_protocolConfig({ finality: 'final' });
    } catch (error) {
      // logger.error({
      //   instance: this,
      //   error,
      // })

      return null;
    }
  }

  getNodeConfig = lodash.throttle(this._getNodeConfig, THROTTLE_INTERVAL);

  async getAccessKey(address, publicKey) {
    return this.provider.query(`access_key/${address}/${publicKey}`, '');
  }

  async sendTransaction(rawtx) {
    const { transaction } = await this.provider.sendJsonRpc(
      'broadcast_tx_commit',
      [rawtx],
    );

    return { txid: transaction?.hash };
  }

  async _getGasPrice() {
    try {
      const { gas_price: gasPrice } = await this.provider.gasPrice(null);

      return gasPrice;
    } catch (error) {
      // logger.error({
      //   instance: this,
      //   error,
      // })

      return null;
    }
  }

  getGasPrice = lodash.throttle(this._getGasPrice, THROTTLE_INTERVAL);

  async getInfo(selfAddress) {
    try {
      const {
        runtime_config: { storage_amount_per_byte: storageAmountPerByte },
      } = await this.getNodeConfig();

      const info = await this.provider.query({
        request_type: 'view_account',
        finality: 'final',
        account_id: selfAddress,
      });

      const stateStaked = new this.wallet.BN(info.storage_usage).mul(
        new this.wallet.BN(storageAmountPerByte),
      );
      const staked = new this.wallet.BN(info.locked);
      const unspendable = stateStaked.sub(staked);
      const total = new this.wallet.BN(info.amount).add(staked);
      const balance = total.sub(staked);

      return {
        balance: balance.toString(),
        unspendable,
      };
    } catch (error) {
      if (error.type === ACCOUNT_DOES_NOT_EXIST_ERROR) {
        return {
          balance: '0',
        };
      }

      throw error;
    }
  }

  async fetchStakingInfo(selfAddress, { activeValidators = [] } = {}) {
    const validators = {};

    for (const { address } of activeValidators) {
      validators[address] = await this.getValidatorInfo(selfAddress, address);
    }

    const [unstaking, staked, availableWithdrawals, pendingWithdrawals] = [
      'unstaking',
      'staked',
      'availableWithdrawals',
      'pendingWithdrawals',
    ].map((field) =>
      Object.values(validators).reduce((acc, validator) => {
        return new this.wallet.BN(acc).add(validator[field].toBN()).toString();
      }, '0'),
    );

    return {
      staked: new Amount(staked, this.wallet),
      unstaking: new Amount(unstaking, this.wallet),
      pendingWithdrawals: new Amount(pendingWithdrawals, this.wallet),
      availableWithdrawals: new Amount(
        new this.wallet.BN(availableWithdrawals).gt(MIN_DISPLAY_YOCTO)
          ? availableWithdrawals
          : '0',
        this.wallet,
      ),
      validators,
    };
  }

  /**
   * Fetch stakings info from validator smart-contract
   *
   * @param address
   * @param validator
   * @returns {Promise<{unstaking: Amount, total: Amount, availableForWithdraw: Amount, pendingWithdrawals: Amount, staked: Amount, availableWithdrawals: Amount}>}
   */
  async getValidatorInfo(address, validator) {
    const [total, staked, unstaking, availableForWithdraw] = await Promise.all([
      this.viewFunction(validator, 'get_account_total_balance', {
        account_id: address,
      }),
      this.viewFunction(validator, 'get_account_staked_balance', {
        account_id: address,
      }),
      this.viewFunction(validator, 'get_account_unstaked_balance', {
        account_id: address,
      }),
      this.viewFunction(validator, 'is_account_unstaked_balance_available', {
        account_id: address,
      }),
    ]);

    /*
     * Rewards calculating by initial deposit amount subsctracted by the actual total balance fetched by `get_account_staked_balance`.
     * E.g. initially staked some amount, then after few epochs staking balance will be increased, difference betwen initial and increased is an a reward amount.
     */

    return {
      total: new Amount(total, this.wallet),
      staked: new Amount(staked, this.wallet),
      unstaking: new Amount(unstaking, this.wallet),
      availableWithdrawals: new Amount(
        availableForWithdraw ? unstaking : '0',
        this.wallet,
      ),
      pendingWithdrawals: new Amount(
        availableForWithdraw ? '0' : unstaking,
        this.wallet,
      ),
    };
  }

  /**
   * Function to call smart-contract method.
   *
   * List of available method names:
   *
   * 'get_account_staked_balance',
   * 'get_account_unstaked_balance',
   * 'get_account_total_balance',
   * 'is_account_unstaked_balance_available',
   * 'get_total_staked_balance',
   * 'get_owner_id'
   * 'get_reward_fee_fraction'
   * 'get_farms'
   * 'get_farm'
   * 'get_active_farms',
   * 'get_unclaimed_reward',
   * 'get_pool_summary',
   *
   * @param contractId
   * @param methodName
   * @param args
   * @throws ExternalError
   * @returns {Promise<any>}
   */
  async viewFunction(contractId, methodName, args = {}) {
    try {
      const serializedArgs = this.bytesJsonStringify(args).toString('base64');

      const result = await this.provider.query({
        request_type: 'call_function',
        account_id: contractId,
        method_name: methodName,
        args_base64: serializedArgs,
        finality: 'final',
      });

      return (
        result?.result?.length > 0 &&
        this.jsonFromRawResponse(Buffer.from(result.result))
      );
    } catch (error) {
      console.warn(error);
      throw new ExternalError({ type: EXTERNAL_ERROR, error, instance: this });
    }
  }

  jsonFromRawResponse(res) {
    return JSON.parse(Buffer.from(res).toString());
  }

  bytesJsonStringify(args) {
    return Buffer.from(JSON.stringify(args));
  }
}

export default NearRPCExplorer;

// import configManager from '../ConfigManager';
// import logger from '../Logger';
import { UndeclaredAbstractMethodError } from 'src/errors';
import defaultValidators from 'src/resources/staking/validators.json';
import { Amount } from 'src/utils';
import {
  STAKING_PREDEFINED_VALIDATORS_UPDATED,
  STAKING_BALANCES_UPDATED,
  STAKING_BALANCES_CACHE,
} from 'src/utils/eventTopics';

const undefinedValidatorWarn = (ticker) => `Probably ${ticker} doesn't have such validator yet\n`;

const StakingMixin = (superclass) =>
  class extends superclass {
    #balances;
    #predefinedValidators;

    constructor(config) {
      super(config);

      this.#predefinedValidators = [];
      this.#balances = {};

      this.#restoreCachedBalances();
      // configManager.register(this.getPredefineValidatorsConfigName());
    }

    get balances() {
      return this.#balances;
    }

    get predefinedValidators() {
      return this.#predefinedValidators;
    }

    defaultAmount() {
      return new Amount('0', this);
    }

    /**
     * Restore cached balances from localStorage
     * @return {Promise<void>}
     */
    async #restoreCachedBalances() {
      // const { topic } = STAKING_BALANCES_CACHE(this.id);
      //
      // try {
      //   const cachedData = localStorage.getItem(topic);
      //
      //   return this.setBalances(
      //     cachedData
      //       ? this.#transformCachedBalancesFromJSON(JSON.parse(cachedData))
      //       : await this.makeStakingInfoStruct(),
      //   );
      // } catch (error) {
      //   // logger.error({
      //   //   instance: this,
      //   //   error,
      //   // });
      //
      //   return this.setBalances(await this.makeStakingInfoStruct());
      // }
    }

    /**
     * Update cached balances
     * @param balances
     */
    #updateCachedBalances(balances) {
      // const { topic, payload } = STAKING_BALANCES_CACHE(this.id, balances);
      //
      // localStorage.setItem(topic, JSON.stringify(payload));
    }

    /**
     * Transform balances JSON object
     *
     * @param value
     * @returns {Amount}
     */
    #transformBalanceFieldFromJSON(value) {
      try {
        return new Amount(value, this);
      } catch (error) {
        throw new Error(`${this}: \`transformValidatorsObjectFromJSON\`: Unable to transform value: ${value}`);
      }
    }

    /**
     * Transform validators JSON object
     * @param validatorsJSONObject
     * @returns {{}}
     */
    #transformValidatorsObjectFromJSON(validatorsJSONObject) {
      return Object.entries(validatorsJSONObject).reduce((validators, [validator, validatorInfo]) => {
        validators[validator] = Object.entries(validatorInfo).reduce((acc, [key, value]) => {
          if (['address', 'contract', 'owner'].includes(key)) {
            acc[key] = value;
          } else {
            try {
              acc[key] = this.#transformBalanceFieldFromJSON(value);
            } catch (error) {
              throw new Error(`${error.message}, key: ${key}`);
            }
          }

          return acc;
        }, {});

        return validators;
      }, {});
    }

    /**
     * transform balances from JSON
     * @param {} balances
     * @return {{}}
     */
    #transformCachedBalancesFromJSON(balances = {}) {
      return Object.entries(balances).reduce((acc, [key, value]) => {
        if (key === 'additional') {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (nestedKey === 'frozenVotesV1') {
              value[nestedKey] = this.#transformBalanceFieldFromJSON(nestedValue);
            }
          });

          acc[key] = value;
        } else if (key === 'validators') {
          acc[key] = this.#transformValidatorsObjectFromJSON(value);
        } else {
          try {
            acc[key] = this.#transformBalanceFieldFromJSON(value);
          } catch (error) {
            throw new Error(`${error.message}, key: ${key}`);
          }
        }

        return acc;
      }, {});
    }

    /**
     * Setter replaced by method
     * to protect from occasional direct mutation
     *
     * @param balances
     */
    setBalances(balances) {
      this.#balances = balances;

      const { topic, payload } = STAKING_BALANCES_UPDATED(this.id, this.balances);

      this.#updateCachedBalances(payload);
      this.eventEmitter.emit(topic, payload);
    }

    isStakingSupported() {
      return true;
    }

    /**
     * Whether re-delegation to another validator is supported
     *
     * @returns {boolean}
     */
    isRedelegationSupported() {
      return false;
    }

    /**
     *
     * @param {Amount} total
     * @param {Amount} staked
     * @param {Amount} delegatedVotes
     * @param {Amount} availableVotes
     * @param {Amount} unstaking
     * @param {Amount} pendingWithdrawals
     * @param {Amount} availableWithdrawals
     * @param {Amount} rewards
     * @param {{}} validators
     * @param {{}} additional
     * @returns {Promise<{
     * unstaking: Amount,
     * total: Amount,
     * availableForStake: Amount>,
     * availableVotes: Amount,
     * pendingWithdrawals: Amount,
     * validators: Amount,
     * staked: Amount,
     * delegatedVotes: Amount,
     * availableWithdrawals: Amount,
     * rewards: Amount}>
     * }
     */
    async makeStakingInfoStruct({
      staked = this.defaultAmount(),
      unstaking = this.defaultAmount(),
      delegatedVotes = this.defaultAmount(),
      availableVotes = this.defaultAmount(),
      pendingWithdrawals = this.defaultAmount(),
      availableWithdrawals = this.defaultAmount(),
      availableForUnstake = this.defaultAmount(),
      rewards = this.defaultAmount(),
      frozenVotes = this.defaultAmount(),
      frozenEnergy = this.defaultAmount(),
      validators = {},
      additional = {},
    } = {}) {
      return {
        total: this.calculateTotal({
          balance: new Amount(this.balance || '0', this),
          staked,
          unstaking,
          rewards,
          availableWithdrawals,
          frozenVotes,
          frozenEnergy,
        }),
        availableForStake: await this.calculateAvailableForStake({
          balance: new Amount(this.balance || '0', this),
          staked,
          unstaking,
          rewards,
          frozenVotes,
          frozenEnergy,
          availableVotes,
        }),
        availableForUnstake,
        staked,
        unstaking,
        delegatedVotes,
        availableVotes,
        frozenVotes,
        frozenEnergy,
        pendingWithdrawals,
        availableWithdrawals,
        rewards,
        validators,
        additional,
      };
    }

    fetchStakingInfo() {
      return this.getProvider('staking').fetchStakingInfo(this.address);
    }

    /**
     * fetch and struct staking balances
     * @returns {Promise<any | {
     * unstaking: string,
     * total: string,
     * availableForStake: string,
     * pendingWithdrawals: string,
     * validators: {},
     * staked: string,
     * availableWithdrawals: string,
     * rewards: string} | {}>
     * }
     */
    async getStakingInfo() {
      const stakingInfo = await this.fetchStakingInfo();

      this.setBalances(await this.makeStakingInfoStruct(stakingInfo));

      return this.#balances;
    }

    /**
     * Calc Total balance
     * @param balance
     * @param staked
     * @param unstaking
     * @param availableWithdrawals
     * @param pendingWithdrawals
     * @abstract
     */
    calculateTotal({ balance, staked, unstaking, availableWithdrawals, pendingWithdrawals, rewards }) {
      throw new UndeclaredAbstractMethodError('calculateTotal', this);
    }

    /**
     * Calc available balance for stake
     * @param balance
     * @param staked
     * @param unstaking
     * @return {Promise<void>}
     * @abstract
     */
    async calculateAvailableForStake({ balance, staked, unstaking }) {
      throw new UndeclaredAbstractMethodError('calculateAvailableForStake', this);
    }

    /**
     * Calculate available for unstake amount
     * @abstract
     */
    calculateAvailableForUnstake() {
      throw new UndeclaredAbstractMethodError('calculateAvailableForUnstake', this);
    }

    /**
     * calculate total staked amount
     * @returns {*}
     * @abstract
     */
    calculateStakedAmount() {
      throw new UndeclaredAbstractMethodError('calculateStakedAmount', this);
    }

    /**
     * Calculate total Unstaking amount
     * @abstract
     */
    calculateUnstakingAmount() {
      throw new UndeclaredAbstractMethodError('calculateUnstakingAmount', this);
    }

    /**
     * Calculate total Available withdrawals
     * @abstract
     */
    calculateAvailableWithdrawalsAmount() {
      throw new UndeclaredAbstractMethodError('calculateAvailableWithdrawalsAmount', this);
    }

    /**
     * Calculate total Pending withdrawals
     * @abstract
     */
    calculatePendingWithdrawalsAmount() {
      throw new UndeclaredAbstractMethodError('calculatePendingWithdrawalsAmount', this);
    }

    /**
     * Calculate total Rewards
     * @abstract
     */
    calculateRewards() {
      throw new UndeclaredAbstractMethodError('calculateRewards', this);
    }

    /**
     * Return user validators-list from net
     * with validator addr as object field name
     * @returns {{}}
     */
    getValidators() {
      return this.#balances.validators;
    }

    /**
     * Returs total balance
     *
     * @returns {string}
     */
    getTotalBalance() {
      return this.#balances.total;
    }

    /**
     * Return available balance for stake
     *
     * @returns {string}
     */
    getAvailableBalance() {
      return this.#balances.availableForStake;
    }

    getAvailableForUnstakeBalance() {
      return this.#balances.availableForUnstake;
    }

    /**
     * By default it returns balance by type and validator (if it is set)
     *
     * @param {string} balanceType The balance type e.g. rewards, staked and etc.
     * @param {string} validatorAddress The validator address
     * @returns {string}
     */
    #getBalanceByType(balanceType, validatorAddress) {
      if (validatorAddress) {
        try {
          return this.#balances.validators[validatorAddress][balanceType];
        } catch (error) {
          console.warn(undefinedValidatorWarn(this.ticker, balanceType, validatorAddress), error);
          return '0';
        }
      }

      return this.#balances[balanceType];
    }

    /**
     * By default, returns total staked balance
     * or for specific validator if validator addres is passed
     *
     * @param validator Address for validator
     * @returns {string}
     */
    getStakedBalance(validator) {
      return this.#getBalanceByType('staked', validator);
    }

    /**
     * By default, returns total unstaking balance
     * or for specific validator if validator addres is passed
     *
     * @param validator Address for validator
     * @returns {string}
     */
    getUnstakingBalance(validator) {
      return this.#getBalanceByType('unstaking', validator);
    }

    /**
     * By default, returns total rewards
     * or from specific validator if validator addres is passed
     *
     * @param validator Address for validator
     * @returns {string}
     */
    getRewards(validator) {
      return this.#getBalanceByType('rewards', validator);
    }

    /**
     * returns delegated votes
     * @returns {Amount}
     */
    getDelegatedVotes() {
      return this.#balances.delegatedVotes;
    }

    /**
     * returns available votes
     * @returns {Amount}
     */
    getAvailableVotes() {
      return this.#balances.availableVotes;
    }

    getFrozenVotes() {
      return this.#balances.frozenVotes;
    }

    getFrozenEnergy() {
      return this.#balances.frozenEnergy;
    }

    /**
     * By default, returns total pending withdarals
     * or from specific validator if validator addres is passed
     *
     * @param validator Address for validator
     * @returns {string}
     */
    getPendingWithdrawals(validator) {
      return this.#getBalanceByType('pendingWithdrawals', validator);
    }

    /**
     * By default, returns total available withdrawals
     * or from specific validator if validator addres is passed
     *
     * @param validator Address for validator
     * @returns {string}
     */
    getAvailableWithdrawals(validator) {
      return this.#getBalanceByType('availableWithdrawals', validator);
    }

    /**
     * Fetch external validators list
     * currently used by address
     *
     * @param address {String}
     * @returns {Promise<*>}
     */
    getUserValidators(address) {
      return this.getProvider('staking').getUserValidators(address);
    }

    getAdditionalInfo() {
      return this.#getBalanceByType('additional');
    }

    /**
     * Fetches remote predefined validators-list
     *
     * @returns {Promise<[]>}
     */
    async getPredefinedValidators() {
      // memoize fetch
      if (this.#predefinedValidators.length > 0) {
        return this.#predefinedValidators;
      }

      // const validators = await configManager
      //   .get(this.getPredefineValidatorsConfigName())
      //   .catch((error) =>
      //     // logger.error({
      //     //   instance: this,
      //     //   error,
      //     // }),
      //   );

      this.#predefinedValidators = this.getDefaultValidators();

      const { topic, payload } = STAKING_PREDEFINED_VALIDATORS_UPDATED(this.id, this.#predefinedValidators);

      this.eventEmitter.emit(topic, payload);

      return this.#predefinedValidators;
    }

    /**
     * Get local validators-list
     *
     * @returns {*|*[]}
     */
    getDefaultValidators() {
      const defaultList = defaultValidators.find(({ currency }) => currency === this.ticker);

      return defaultList?.validators ?? [];
    }

    /**
     * Remote validators-list config identifier
     *
     * @returns {string}
     */
    getPredefineValidatorsConfigIdentifier() {
      return this.ticker;
    }

    /**
     * Remote validators-list config name
     *
     * @returns {string}
     */
    getPredefineValidatorsConfigName() {
      return `stake_validators_${this.getPredefineValidatorsConfigIdentifier().toLowerCase()}`;
    }
  };

export default StakingMixin;

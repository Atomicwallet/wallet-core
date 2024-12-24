// https://docs.bnbchain.org/docs/beaconchain/develop/api-reference/dex-api/staking/

import Explorer from '../Explorer'
import { ExplorerRequestError } from '../../errors/index.js'
import { GET_TRANSACTIONS_TYPE, EXTERNAL_ERROR } from '../../utils/const'
import { Amount } from '../../utils'

const DEFAULT_REQ_OFFSET = 0
const MAX_REQ_LIMIT = 100

class BinanceBCExplorer extends Explorer {
  getAllowedTickers () {
    return ['BNB', 'BSC']
  }

  getStakingInfoMethod () {
    return 'get'
  }

  getStakingInfoBaseUrl (address) {
    return `${this.config.baseUrl}v1/staking/chains/bsc/delegators/${address}`
  }

  getDelegationsUrl (address) {
    return `${this.getStakingInfoBaseUrl(address)}/delegations`
  }

  getUnDelegationsUrl (address) {
    return `${this.getStakingInfoBaseUrl(address)}/ubds`
  }

  getReDelegationsUrl (address) {
    return `${this.getStakingInfoBaseUrl(address)}/reds`
  }

  getRewardsUrl (address) {
    return `${this.getStakingInfoBaseUrl(address)}/rewards`
  }

  /**
   * Fetch active delegations for given address
   *
   * @param address { String }
   * @param offset {  Number}
   * @param limit { Number }
   * @returns {Promise<QueryDelegationsResponse>)|[]>}
   * */
  async getDelegations ({ address = this.wallet.address, offset = DEFAULT_REQ_OFFSET, limit = MAX_REQ_LIMIT } = {}) {
    const response = await this.request(this.getDelegationsUrl(address), this.getStakingInfoMethod(), { offset, limit })
      .catch((error) => {
        throw new ExplorerRequestError({ type: GET_TRANSACTIONS_TYPE, error, instance: this })
      })

    return response?.delegations
  }

  /**
   * Fetch active unDelegations for given address
   *
   * @param address { String }
   * @param offset {  Number}
   * @param limit { Number }
   * @returns {Promise<QueryUndelegationsResponse>)|[]>}
   * */
  async getUnDelegations ({ address = this.wallet.address, offset = DEFAULT_REQ_OFFSET, limit = MAX_REQ_LIMIT } = {}) {
    const response = await this.request(this.getUnDelegationsUrl(address), this.getStakingInfoMethod(), { offset, limit })
      .catch((error) => {
        throw new ExplorerRequestError({ type: GET_TRANSACTIONS_TYPE, error, instance: this })
      })

    return response?.unbondingDelegations.filter(({ completeHeight }) => !completeHeight)
  }

  /**
   * Fetch active reDelegations for given address
   *
   * @param address { String }
   * @param offset {  Number}
   * @param limit { Number }
   * @returns {Promise<QueryRedelegationsResponse>)|[]>}
   */
  async getReDelegations ({ address = this.wallet.address, offset = DEFAULT_REQ_OFFSET, limit = MAX_REQ_LIMIT } = {}) {
    const response = await this.request(this.getReDelegationsUrl(address), this.getStakingInfoMethod(), { offset, limit })
      .catch((error) => {
        throw new ExplorerRequestError({ type: GET_TRANSACTIONS_TYPE, error, instance: this })
      })

    return response?.redelegations
  }

  /**
   * Fetch active rewards for given address
   *
   * @param address { String }
   * @param offset { Number }
   * @param limit { Number }
   * @returns {Promise<*>}
   */
  async getRewards ({ address = this.wallet.address, offset = DEFAULT_REQ_OFFSET, limit = MAX_REQ_LIMIT } = {}) {
    const response = await this.request(this.getRewardsUrl(address), this.getStakingInfoMethod(), { offset, limit })
      .catch((error) => {
        throw new ExplorerRequestError({ type: GET_TRANSACTIONS_TYPE, error, instance: this })
      })

    return response?.rewardDetails
  }

  /**
   * Fetch active validators for given user address
   * returns validator address and validator name
   *
   * @param operations {Array <Array<Object>, Array<Object>> | undefined}
   * @param address {String}
   * @returns {Promise<any>}
   */
  async getUserValidators (address = this.wallet.address, operations = undefined) {
    try {
      if (!operations) {
        operations = await Promise.all([this.getDelegations({ address }), this.getUnDelegations({ address })])
      }
      // flat map operations -> dedup validators address via Map
      const validatorsMap = new Map()

      operations
        .flatMap((ops) => ops)
        .forEach((op) => {
          Object.keys(op)
            .forEach((key) => {
              validatorsMap.set(
                op.validator,
                {
                  ...validatorsMap.get(op.validator),
                  [key]: op[key],
                })
            })
        })

      return Array.from(validatorsMap.values())
    } catch (error) {
      throw new ExplorerRequestError({ type: EXTERNAL_ERROR, error, instance: this })
    }
  }

  /**
   * Fetch staking balances from active validators by given user address
   *
   * @param address {String}
   * @returns {Promise<{staking: {total: string, validators: {}, unstake: string}, total: *}>}
   */
  async fetchStakingInfo (address) {
    const [delegations, unbonding, rewardsInfo] = await Promise.all([this.getDelegations({ address }), this.getUnDelegations({ address }), this.getRewards({ address })])

    const stakings = delegations.reduce((acc, next) => {
      return acc.set(next.validator, next)
    }, new Map())

    const unstakings = unbonding.reduce((acc, next) => {
      return acc.set(next.validator, next)
    }, new Map())

    const rewards = rewardsInfo.reduce((acc, next) => {
      const prevValidator = acc.get(next.validator)

      if (prevValidator) {
        next.reward += prevValidator.reward
      }

      return acc.set(next.validator, next)
    }, new Map())

    const userValidators = await this.getUserValidators(address, [delegations, unbonding])

    const validators = userValidators.reduce((acc, { validatorName, validator: validatorAddress, valName }) => {
      const staked = new Amount(this.wallet.toMinimalUnit(stakings.get(validatorAddress)?.amount).toString(), this.wallet)
      const unstaked = new Amount(this.wallet.toMinimalUnit(unstakings.get(validatorAddress)?.balance).toString(), this.wallet)

      acc[validatorAddress] = {
        staked,
        unstaked,
        rewards: new Amount(this.wallet.toMinimalUnit(rewards.get(validatorAddress)?.reward).toString(), this.wallet),
        name: validatorName || valName,
        isUnstakeAvailable: staked.toBN().gt(new this.wallet.BN(0)) && unstaked.toBN().eq(new this.wallet.BN(0)),
      }

      return acc
    }, {})

    const [unstake, totalStake, totalRewards] = ['unstaked', 'staked', 'rewards'].map((field) => Object.values(validators)
      .reduce((acc, next) => acc.add((next[field]).toBN()), new this.wallet.BN('0')))

    return {
      total: new Amount(totalStake.add(unstake).toString(), this.wallet), // min
      staked: new Amount(totalStake.toString(), this.wallet), // min
      unstaking: new Amount(unstake.toString(), this.wallet), // min
      rewards: new Amount(totalRewards.toString(), this.wallet), // min
      validators,
    }
  }
}

export default BinanceBCExplorer

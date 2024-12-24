import Explorer from '../Explorer'

class MintscanExplorer extends Explorer {
  getAllowedTickers () {
    return ['ATOM']
  }

  getApiPrefix () {
    return 'v1'
  }

  getInfoUrl (address) {
    return `${this.getApiPrefix()}/account/${address}`
  }

  modifyInfoResponse (response) {
    const { balance, rewards, delegations, unbonding_delegations: unbondingDelegations } = response

    let available = '0'
    const staking = { validators: {}, total: new this.wallet.BN('0') }
    const unbonding = { validators: {}, total: new this.wallet.BN('0') }
    let rewardsBalance = new this.wallet.BN(0)

    if (balance && balance.length > 0) {
      available = new this.wallet.BN(balance[0].amount).toString()
    }

    if (rewards && rewards.length > 0) {
      rewards.forEach(({ amount }) => {
        rewardsBalance = rewardsBalance.add(new this.wallet.BN(amount.split('.')[0]))
      })
    }

    if (delegations && delegations.length > 0) {
      let total = new this.wallet.BN('0')

      delegations.forEach(({ moniker, shares, validator_address: address }) => {
        staking.validators[moniker] = {
          shares: this.wallet.toCurrencyUnit(shares.split('.')[0]),
          address,
        }

        total = total.add(new this.wallet.BN(shares.split('.')[0]))
      })

      staking.total = this.wallet.toCurrencyUnit(total.toString())
    }

    if (unbondingDelegations && unbondingDelegations.length > 0) {
      let total = new this.wallet.BN('0')

      unbondingDelegations.forEach(({ moniker, entries }) => {
        unbonding.validators[moniker] = entries
          .map((entry) => new this.wallet.BN(entry.balance.split('.')[0]))
          .reduce((prev, cur) => {
            return prev.add(new this.wallet.BN(cur))
          }, new this.wallet.BN('0'))

        total = total.add(unbonding.validators[moniker])
      })

      unbonding.total = this.wallet.toCurrencyUnit(total.toString().split('.')[0])
    }

    return {
      balance: available,
      balances: {
        available: this.wallet.toCurrencyUnit(available),
        staking,
        unbonding,
        rewards: this.wallet.toCurrencyUnit(rewardsBalance),
      },
      transactions: this.wallet.transactions,
    }
  }
}

export default MintscanExplorer

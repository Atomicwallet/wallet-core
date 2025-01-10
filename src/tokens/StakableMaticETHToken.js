import { StakingMixin, Web3Mixin } from '../coins/mixins';
import { Amount } from '../utils';
import MaticStakingManager from './ABI/ERC-20/MaticStakingManager';
import MaticValidatorsShare from './ABI/ERC-20/MaticValidatorsShare';
import standard from './ABI/ERC-20/standard';
import ETHToken from './ETHToken';

const DEFAULT_APPROVAL_GAS_LIMIT = 50000;
const DEFALT_STAKING_GAS_LIMIT = 300000;
const DEFAULT_CLAIM_REWARDS_GAS_LIMIT = 170000;
const DEFAULT_STAKING_CONTRACT = '0x5E3EF299FDDF15EAA0432E6E66473ACE8C13D908';
const MAX_ALLOWED_AMOUNT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// Minimal amount for claim rewards
// https://etherscan.io/address/0xf98864DA30a5bd657B13e70A57f5718aBf7BAB31#code#L1461

export default class StakableMaticETHToken extends Web3Mixin(
  StakingMixin(ETHToken),
) {
  constructor({ config, ...args }) {
    super({ config, ...args });

    this.stakingContract = config.stakingContract ?? DEFAULT_STAKING_CONTRACT;
    this.stakingGasLimit = config.stakingGasLimit ?? DEFALT_STAKING_GAS_LIMIT;
    this.unstakingGasLimit =
      config.unstakingGasLimit ?? DEFALT_STAKING_GAS_LIMIT;
    this.restakeRewardsGasLimit =
      config.restakeRewardsGasLimit ?? DEFALT_STAKING_GAS_LIMIT;
    this.claimRewardsGasLimit =
      config.claimRewardsGasLimit ?? DEFAULT_CLAIM_REWARDS_GAS_LIMIT;
    this.withdrawGasLimit = config.withdrawGasLimit ?? DEFALT_STAKING_GAS_LIMIT;
    this.approvalGasLimit =
      config.approvalGasLimit ?? DEFAULT_APPROVAL_GAS_LIMIT;
  }

  async getInfo() {
    await super.getInfo();

    await this.getStakingInfo();

    return { balance: this.balance, balances: this.balances };
  }

  calculateTotal({ balance, staked, unstaking, rewards }) {
    const total = balance
      .toBN()
      .add(staked.toBN())
      .add(rewards.toBN())
      .add(unstaking.toBN())
      .toString();

    return new Amount(total, this);
  }

  async calculateAvailableForStake({ balance, availableVotes }) {
    if (availableVotes.toBN().gte(balance.toBN())) {
      return new Amount(balance.toMinimal(), this);
    }

    return new Amount('0', this);
  }

  /**
   * Accumulate validators field value
   * @param { object } validators
   * @param { string } ieldName
   * @return { Amount }
   */
  accumulateValidatorsValues(validators, fieldName) {
    return Object.values(validators).reduce(
      (acc, { [`${fieldName}`]: value }) => {
        return new Amount(acc.toBN().add(value.toBN()), this);
      },
      new Amount('0', this),
    );
  }

  /**
   * Cumulative staked amount
   * @param { object }validators
   * @return {Amount}
   */
  calculateStaked(validators) {
    return this.accumulateValidatorsValues(validators, 'staked');
  }

  /**
   * Cumulative staked amount
   * @param { object }validators
   * @return {Amount}
   */
  calculateUnstaking(validators) {
    return this.accumulateValidatorsValues(validators, 'unstaking');
  }

  /**
   * Cumulative rewards amount
   * @param { object }validators
   * @return { Amount }
   */
  calculateRewards(validators) {
    return this.accumulateValidatorsValues(validators, 'rewards');
  }

  /**
   * Cumulative rewards amount
   * @param { object }validators
   * @return { Amount }
   */
  calculatePendingWithdrawals(validators) {
    return this.accumulateValidatorsValues(validators, 'pendingWithdrawals');
  }

  /**
   * Cumulative rewards amount
   * @param { object }validators
   * @return { Amount }
   */
  calculateAvailableWithdrawals(validators) {
    return this.accumulateValidatorsValues(validators, 'availableWithdrawals');
  }

  async fetchStakingInfo() {
    // POS Manager 0x5e3ef299fddf15eaa0432e6e66473ace8c13d908
    const validators = Object.fromEntries(
      await Promise.all(
        this.predefinedValidators.map(async ({ address }) => {
          const currentEpoch = await this.makeRawCall(
            MaticStakingManager,
            this.stakingContract,
            'currentEpoch',
          );
          const unbondNonce = await this.makeRawCall(
            MaticValidatorsShare,
            address,
            'unbondNonces',
            [this.address],
          );
          const { shares, withdrawEpoch } = await this.makeRawCall(
            MaticValidatorsShare,
            address,
            'unbonds_new',
            [this.address, unbondNonce],
          );

          // 82 checkpoints - according to FAQ is unbonding period, approx 9 days
          const isAvailable = Number(currentEpoch) > Number(withdrawEpoch) + 82;

          const pendingWithdrawals = new Amount(
            isAvailable ? '0' : shares,
            this,
          );
          const availableWithdrawals = new Amount(
            isAvailable ? shares : '0',
            this,
          );
          const unstaking = new Amount(
            pendingWithdrawals
              .toBN()
              .add(availableWithdrawals.toBN())
              .toString(),
            this,
          );

          return [
            address,
            {
              staked: new Amount(
                await this.makeRawCall(
                  MaticValidatorsShare,
                  address,
                  'balanceOf',
                  [this.address],
                ),
                this,
              ),
              rewards: new Amount(
                await this.makeRawCall(
                  MaticValidatorsShare,
                  address,
                  'getLiquidRewards',
                  [this.address],
                ),
                this,
              ),
              pendingWithdrawals,
              availableWithdrawals,
              unstaking,
            },
          ];
        }),
      ),
    );

    const staked = this.calculateStaked(validators);
    const unstaking = this.calculateUnstaking(validators);
    const rewards = this.calculateRewards(validators);
    const pendingWithdrawals = this.calculatePendingWithdrawals(validators);
    const availableWithdrawals = this.calculateAvailableWithdrawals(validators);

    const availableVotes = new Amount(
      await this.makeRawCall(standard, this.contract, 'allowance', [
        this.address,
        this.stakingContract,
      ]),
      this,
    );

    return {
      balance: new Amount(this.balance, this),
      staked,
      unstaking,
      availableVotes,
      pendingWithdrawals,
      availableWithdrawals,
      rewards,
      validators,
    };
  }

  /**
   * Approves amount of tokens to be spent by `address`
   * @param { string } address
   * @param { string } amount
   * @return { string }
   */
  makeApproval({ address, amount }) {
    const data = this.createSmartContractCall({
      smartContractAddress: address,
      standard: true,
      action: 'approve',
      args: [address, amount],
    });

    return data;
  }

  /**
   * Add amount of tokens to current approved amount which can be spent by `address`
   * @param address
   * @param amount'
   * @return {string}
   */
  increaseAllowance({ address, amount }) {
    const data = this.createSmartContractCall({
      smartContractAddress: address,
      standard: true,
      action: 'increaseAllowance',
      args: [address, amount],
    });

    return data;
  }

  createApproveTransaction({
    nonce,
    userGasPrice,
    gasLimit = this.approvalGasLimit,
    multiplier,
  } = {}) {
    // stake manager 0x5e3ef299fddf15eaa0432e6e66473ace8c13d908

    // @TODO maybe check if already have approved tokens, then use `increaseAllowance` instead?
    const paymentData = this.makeApproval({
      address: this.stakingContract,
      amount: MAX_ALLOWED_AMOUNT,
    });

    return this.createRawTransactions({
      address: this.contract,
      amount: '0',
      paymentData,
      nonce,
      userGasPrice,
      gasLimit,
      multiplier,
    });
  }

  createDelegationTransaction({
    amount,
    validator,
    nonce,
    userGasPrice,
    gasLimit = this.stakingGasLimit,
    multiplier,
  }) {
    const contractInterface = new this.coreLibrary.eth.Contract(
      MaticValidatorsShare,
      validator,
    );

    const paymentData = contractInterface.methods
      .buyVoucher(amount, amount)
      .encodeABI();

    return this.createRawTransactions({
      address: validator,
      paymentData,
      amount: '0',
      nonce,
      userGasPrice,
      gasLimit,
      multiplier,
    });
  }

  createUnstakeTransaction({
    amount,
    validator,
    nonce,
    userGasPrice,
    gasLimit = this.unstakingGasLimit,
    multiplier,
  }) {
    const contractInterface = new this.coreLibrary.eth.Contract(
      MaticValidatorsShare,
      validator,
    );

    const paymentData = contractInterface.methods
      .sellVoucher_new(amount, amount)
      .encodeABI();

    return this.createRawTransactions({
      address: validator,
      paymentData,
      amount: '0',
      nonce,
      userGasPrice,
      gasLimit,
      multiplier,
    });
  }

  async createWithdrawTransaction({
    validator,
    nonce,
    userGasPrice,
    gasLimit = this.withdrawGasLimit,
    multiplier,
  }) {
    const contractInterface = new this.coreLibrary.eth.Contract(
      MaticValidatorsShare,
      validator,
    );
    const unbondNonce = await this.makeRawCall(
      MaticValidatorsShare,
      validator,
      'unbondNonces',
      [this.address],
    );

    const paymentData = contractInterface.methods
      .unstakeClaimTokens_new(unbondNonce)
      .encodeABI();

    return this.createRawTransactions({
      address: validator,
      paymentData,
      amount: '0',
      nonce,
      userGasPrice,
      gasLimit,
      multiplier,
    });
  }

  createClaimRewardsTransaction({
    validator,
    nonce,
    userGasPrice,
    gasLimit = this.claimRewardsGasLimit,
    multiplier,
  }) {
    const contractInterface = new this.coreLibrary.eth.Contract(
      MaticValidatorsShare,
      validator,
    );

    const paymentData = contractInterface.methods.withdrawRewards().encodeABI();

    return this.createRawTransactions({
      address: validator,
      paymentData,
      amount: '0',
      nonce,
      userGasPrice,
      gasLimit,
      multiplier,
    });
  }

  createRestakeRewardsTransaction({
    validator,
    nonce,
    userGasPrice,
    gasLimit = this.restakeRewardsGasLimit,
    multiplier,
  }) {
    const contractInterface = new this.coreLibrary.eth.Contract(
      MaticValidatorsShare,
      validator,
    );

    const paymentData = contractInterface.methods.restake().encodeABI();

    return this.createRawTransactions({
      address: validator,
      paymentData,
      amount: '0',
      nonce,
      userGasPrice,
      gasLimit,
      multiplier,
    });
  }

  getPredefineValidatorsConfigIdentifier() {
    return `${this.ticker.toLowerCase()}_eth`;
  }
}

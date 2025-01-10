export default {
  TRANSACTION: 'Transfer',
  TRANSFER: 'Transfer',
  TRANSFERNFT: 'Transfer Nft',
  MINTNFT: 'Mint Nft',
  STAKE: 'Stake',
  DELEGATE: 'Stake',
  UNSTAKE: 'Unstake',
  UNDELEGATE: 'Unstake',
  UNBONDING: 'Unstake',
  RESTAKE: 'Restake',
  REDELEGATE: 'Restake',
  WITHDRAW: 'Withdraw',
  WITHDRAWAL: 'Withdraw',
  CLAIM: 'Reward',
  REWARD: 'Reward',
  VOTE: 'Vote',
  FREEZE: 'Freeze',
  BUY: 'Buy',
  EXCHANGE: 'Exchange',
};

export const COSMOS_MSG_TO_TYPE = {
  MsgWithdrawDelegatorReward: 'reward',
  MsgDelegate: 'stake',
  MsgUndelegate: 'unstake',
  MsgSend: 'transfer',
};

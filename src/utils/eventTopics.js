export const STAKING_PREDEFINED_VALIDATORS_UPDATED = (id, payload) => {
  return {
    topic: `${id}::staking::predefined-validators-updated`,
    payload,
  };
};

export const STAKING_BALANCES_UPDATED = (id, payload) => {
  return {
    topic: `${id}::staking::balances-updated`,
    payload,
  };
};

export const STAKING_BALANCES_CACHE = (id, payload) => {
  return {
    topic: `${id}-staking-infos`,
    payload,
  };
};

export const HISTORY_WALLET_UPDATED = (id, payload) => {
  return {
    topic: `${id}-history-updated`,
    payload,
  };
};

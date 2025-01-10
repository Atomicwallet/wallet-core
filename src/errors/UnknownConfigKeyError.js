export default class UnknownConfigKeyError extends Error {
  constructor(key) {
    super(`Unknown config key: ${key}`);
  }
}

export default class UnknownConfigKeyError extends Error {
  constructor(key: string) {
    super(`Unknown config key: ${key}`);
  }
}

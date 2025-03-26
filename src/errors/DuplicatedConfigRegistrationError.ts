export default class DuplicatedConfigRegistrationError extends Error {
  constructor(key: string) {
    super(`Trying to register config which is already registered: ${key}`);
  }
}

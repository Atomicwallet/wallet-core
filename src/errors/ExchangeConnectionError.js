class ExchangeConnectionError extends Error {
  constructor () {
    super('Can\'t connect to ChangeNOW')
  }
}

export default ExchangeConnectionError

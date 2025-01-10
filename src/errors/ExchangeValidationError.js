class ExchangeValidationError extends Error {
  constructor() {
    super(
      'Exchange Transaction validation failed, probably exchange tx has not been created properly',
    );
  }
}

export default ExchangeValidationError;

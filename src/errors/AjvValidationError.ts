class AjvValidationError extends Error {
  private validationErrors: unknown;

  constructor(errors: unknown) {
    super('Schema validation failed');
    this.validationErrors = errors;
  }
}

export default AjvValidationError;

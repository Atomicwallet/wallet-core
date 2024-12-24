class AjvValidationError extends Error {
  /**
   * Constructs the AjvValidationError
   *
   * @external Ajv.ErrorObject
   * @see {@link https://ajv.js.org/api.html#validation-errors}
   * @param {Ajv.ErrorObject[]} errors - Array of `ajv` validation errors.
   */
  constructor (errors) {
    super('Schema validation failed')
    this.validationErrors = errors
  }
}

export default AjvValidationError

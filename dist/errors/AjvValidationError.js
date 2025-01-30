class AjvValidationError extends Error {
    constructor(errors) {
        super('Schema validation failed');
        this.validationErrors = errors;
    }
}
export default AjvValidationError;
//# sourceMappingURL=AjvValidationError.js.map
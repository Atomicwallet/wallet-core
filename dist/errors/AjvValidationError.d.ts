declare class AjvValidationError extends Error {
    private validationErrors;
    constructor(errors: unknown);
}
export default AjvValidationError;

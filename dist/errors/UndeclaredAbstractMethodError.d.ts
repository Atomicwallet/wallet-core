declare class UndeclaredAbstractMethodError extends Error {
    constructor(method: string, instance: unknown);
}
export default UndeclaredAbstractMethodError;

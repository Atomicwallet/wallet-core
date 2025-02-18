declare const arrayToObject: <T extends Record<string, unknown>>(array: T[], keyField: keyof T) => Record<string, T | undefined>;
export default arrayToObject;

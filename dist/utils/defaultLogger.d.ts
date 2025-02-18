import { ILogger } from '../abstract/index.js';
declare class DefaultLogger implements ILogger {
    error(errorObject: Record<string, string>): void;
    log(logObject: Record<string, string>): void;
    warn(warnObject: Record<string, string>): void;
}
declare const _default: DefaultLogger;
export default _default;

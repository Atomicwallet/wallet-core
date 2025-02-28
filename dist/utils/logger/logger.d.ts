import { Construct } from '../../utils/index.js';
import { ErrorObject, ILogger } from './types.js';
declare class Logger {
    logger: ILogger;
    constructor();
    setLogger(logger: ILogger): void;
    log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void;
    error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void;
}
declare const _default: Logger;
export default _default;

import { Construct } from 'src/utils';

import { ErrorObject, ILogger } from './types';

class BaseLogger implements ILogger {
  log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    console.log(`[BaseLogger]\n`, error);
  }

  error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    console.error(`[BaseLogger]\n`, error);
  }

  setUserId(userId: string): void {}
}

class Logger {
  logger: ILogger;

  constructor() {
    this.logger = new BaseLogger();
  }

  setLogger(logger: ILogger): void {
    this.logger = logger;
  }

  setUserId(userId: string): void {
    this.logger.setUserId(userId);
  }

  log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    this.logger.log(error);
  }

  error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    this.logger.error(error);
  }
}

export default new Logger();

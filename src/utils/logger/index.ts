import { Construct } from 'src/utils';

export type ErrorObject<T extends Construct, C extends Error> = {
  error: C;
  instance: T;
};

export interface ILogger {
  log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void;
  error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void;
}

export class BaseLogger {
  log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    console.log(error);
  }

  error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    console.error(error);
  }
}

class Logger {
  logger: ILogger;

  constructor() {
    this.logger = new BaseLogger();
  }

  setLogger(logger: ILogger): void {
    this.logger = logger;
  }

  log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    this.logger.log(error);
  }

  error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void {
    this.logger.error(error);
  }
}

export default new Logger();

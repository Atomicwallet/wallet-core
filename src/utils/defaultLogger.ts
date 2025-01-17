import { LoggerInterface } from 'src/abstract';

class DefaultLogger implements LoggerInterface {
  error(errorObject: Record<string, string>): void {
    const msg = JSON.stringify(errorObject);

    console.error(msg);
  }

  log(logObject: Record<string, string>): void {
    const msg = JSON.stringify(logObject);

    console.log(msg);
  }

  warn(warnObject: Record<string, string>): void {
    const msg = JSON.stringify(warnObject);

    console.warn(warnObject);
  }
}

export default new DefaultLogger();

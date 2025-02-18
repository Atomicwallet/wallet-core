import { ILogger } from 'src/abstract';

class DefaultLogger implements ILogger {
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

    console.warn(msg);
  }
}

export default new DefaultLogger();

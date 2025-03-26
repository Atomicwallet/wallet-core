import { logger } from 'src/utils';

class AtomicError extends Error {
  defaultType = 'Unknown';

  constructor(args: any) {
    if (args.error.data) {
      args.error = Object.values(args.error.data).toString();
    }
    const currency = args.instance.ticker || (args.instance.wallet && args.instance.wallet.ticker);

    let errorMessage = '';

    if (args.error.response) {
      const status = args.error.response.status;
      let message = '';

      if (args.error.response.data && args.error.response.data.message) {
        message = args.error.response.data.message;
      } else if (args.error.response.data) {
        message =
          typeof args.error.response.data === 'string' ? args.error.response.data : args.error.response.data.error;
      } else if (args.error.response.detail) {
        message = args.error.response.detail;
      }

      errorMessage = `${status} - ${message}`;
    } else {
      errorMessage = `Unknown error: - ${args.error}`;
    }
    super(args.error?.toString());

    const errorObject = {
      name: args.error.name,
      type: args.type ?? this.defaultType,
      error: errorMessage,
      message: errorMessage,
      currency,
      instance: args.instance,
      stack: this.stack,
      url: undefined,
    };

    if (args.url) {
      errorObject.url = args.url;
    }
    logger.log({ instance: this, error: errorObject });

    this.name = this.constructor.name;
  }
}

export default AtomicError;

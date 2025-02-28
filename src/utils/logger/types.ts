import { Construct } from 'src/utils';

export type ErrorObject<T extends Construct, C extends Error> = {
  error: C;
  instance: T;
};

export interface ILogger {
  log<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void;
  error<T extends Construct, C extends Error>(error: ErrorObject<T, C>): void;
  setUserId(userId: string): void;
}

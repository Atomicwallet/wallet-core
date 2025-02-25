export type ExplorerConfig = {
  baseUrl: string;
  webUrl?: string;
  className: string;
  usedFor?: Array<string>;
  txLimit?: string | number;
  defaultRequestTimeout?: string | number;
};

type IdStruct = {
  ticker: string;
  chainId: number;
  walletType: string;
};

export function generateId({
  ticker,
  chainId,
  walletType = 'EVM',
}: IdStruct): string {
  return `${ticker.toUpperCase()}${chainId}`;
}

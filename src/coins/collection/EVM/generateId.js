export function generateId({ ticker, chainId, walletType = 'EVM' }) {
    return `${ticker.toUpperCase()}${chainId}`;
}

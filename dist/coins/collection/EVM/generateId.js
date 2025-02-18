export function generateId({ ticker, chainId, walletType = 'EVM' }) {
    return `${ticker.toUpperCase()}${chainId}`;
}
//# sourceMappingURL=generateId.js.map
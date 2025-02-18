import walletsConfig from '../resources/wallets_fee.json';
const getWalletConfig = ({ id }) => {
    return walletsConfig.find(({ id: coinId }) => coinId === id);
};
export { getWalletConfig };
//# sourceMappingURL=walletConfig.js.map
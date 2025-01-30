import * as coins from '../coins/collection/index.js';
import createCoin from '../coins/createCoin.js';
import walletsConfig from '../resources/wallets_fee.json';
export const createWallets = async (arg, db, configManager, logger) => {
    const config = arg ? walletsConfig.filter(({ id: coinId }) => coinId === arg.id) : walletsConfig;
    return config.reduce((accum, coinData) => {
        const coinClass = coinData.className;
        if (coins[coinClass]) {
            const wallet = createCoin(coins[coinClass], coinData, db, configManager, logger);
            accum.push(wallet);
        }
        return accum;
    }, []);
};
//# sourceMappingURL=coins.js.map
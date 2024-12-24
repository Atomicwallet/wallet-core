export function getCoinIdFromConfigEntry(entry) {
  return entry.id || entry.ticker || entry.className?.replace('Coin', ''); // Token will be indexed as undefined
}

export function getCoinsIds(config) {
  return config.reduce((acc, cur) => {
    const id = getCoinIdFromConfigEntry(cur);

    if (!id) {
      console.warn(`Could not get coin id for ${JSON.stringify(cur)}`);
      return acc;
    }

    acc.push(id);

    return acc;
  }, []);
}

export function indexCoinLoadersById(config, coinLoaders) {
  return config.reduce((acc, cur) => {
    acc[cur.id] = coinLoaders[cur.className];

    return acc;
  }, {});
}

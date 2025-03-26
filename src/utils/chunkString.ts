const chunkString = (strWallets: string, maxStringLength = 100): string[] => {
  const result: string[] = [];

  while (strWallets.length > maxStringLength) {
    const maxString = strWallets.slice(0, maxStringLength);
    const maxLength = strWallets[maxStringLength] === ',' ? maxStringLength : maxString.lastIndexOf(',');

    result.push(strWallets.slice(0, maxLength));
    strWallets = strWallets.slice(maxLength + 1);
  }

  if (strWallets.length > 0) {
    result.push(strWallets);
  }

  return result;
};

export default chunkString;

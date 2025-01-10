const transformMap = new Map([
  [
    /https:\/\/api\.opensea\.io\/api\/v1\/metadata\/.*\/0x{id}\/?$/,
    ['0x{id}', ({ tokenId }) => tokenId],
  ],
]);

/**
 * Get valid URI by parsing and transforming Uri token
 *
 * @param {Object} rawToken
 * @param {string} [rawToken.contractAddress] - Token contract address.
 * @param {string} [rawToken.tokenId] - Token id.
 * @param {string} rawToken.tokenUri - Source token Uri - to be transformed.
 * @returns {string} - Modified token Uri.
 */
const getTransformedTokenUri = (rawToken) => {
  const { tokenUri } = rawToken;
  let uri = tokenUri;

  transformMap.forEach(([replacePart, fn], test) => {
    const replacement = fn(rawToken);

    uri = test.test(uri) ? uri.replace(replacePart, replacement) : uri;
  });
  return uri;
};

export default getTransformedTokenUri;

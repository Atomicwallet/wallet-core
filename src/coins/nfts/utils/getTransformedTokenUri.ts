const transformMap = new Map([
  [
    /https:\/\/api\.opensea\.io\/api\/v1\/metadata\/.*\/0x{id}\/?$/,
    ['0x{id}', ({ tokenId }: { tokenId: string }) => tokenId],
  ],
]);

/**
 * Get valid URI by parsing and transforming Uri token
 */
export default (rawToken: { contractAddress: string; tokenId: string; tokenUri: string }): string => {
  const { tokenUri } = rawToken;
  let uri = tokenUri;

  transformMap.forEach(([replacePart, fn], test) => {
    if (typeof fn === 'function') {
      const replacement = fn(rawToken);

      uri = test.test(uri) ? uri.replace(replacePart as string, replacement) : uri;
    }
  });
  return uri;
};

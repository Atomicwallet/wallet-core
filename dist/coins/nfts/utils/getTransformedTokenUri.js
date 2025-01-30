const transformMap = new Map([
    [
        /https:\/\/api\.opensea\.io\/api\/v1\/metadata\/.*\/0x{id}\/?$/,
        ['0x{id}', ({ tokenId }) => tokenId],
    ],
]);
/**
 * Get valid URI by parsing and transforming Uri token
 */
export default (rawToken) => {
    const { tokenUri } = rawToken;
    let uri = tokenUri;
    transformMap.forEach(([replacePart, fn], test) => {
        if (typeof fn === 'function') {
            const replacement = fn(rawToken);
            uri = test.test(uri) ? uri.replace(replacePart, replacement) : uri;
        }
    });
    return uri;
};
//# sourceMappingURL=getTransformedTokenUri.js.map
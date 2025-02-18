const generateKeys = async (wallet, { seed, phrase }) => {
    const keysObject = await wallet.loadWallet(seed, phrase);
    return keysObject;
};
const loadKeys = async (wallet, keys, { seed, phrase }) => {
    let isWalletLoadRequired = false;
    if (keys.address) {
        wallet.setAddress(keys.address);
    }
    else {
        isWalletLoadRequired = true;
    }
    if (keys.privateKey) {
        try {
            wallet.setPrivateKey(keys.privateKey, phrase);
        }
        catch (error) {
            isWalletLoadRequired = true;
        }
    }
    else {
        isWalletLoadRequired = true;
    }
    if (isWalletLoadRequired) {
        const genKeys = await generateKeys(wallet, { seed, phrase });
        return { ...genKeys, ...keys };
    }
    return keys;
};
export { generateKeys, loadKeys };
//# sourceMappingURL=keys.js.map
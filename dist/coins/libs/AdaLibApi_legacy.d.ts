declare namespace _default {
    export { getDerivationPathFromAddress };
    export { getPrivateKeyByMnemonic };
    export { getAddressByPrivateKeySync as getAddressByPrivateKey };
    export { getTxFee };
    export { prepareSignedTx };
    export { validateAddress };
    export { getHDKey };
}
export default _default;
/**
 * @param address
 * @param privateKey
 */
declare function getDerivationPathFromAddress(address: any, privateKey: any): Promise<any>;
/**
 * return private key from mnemonic string
 * @param mnemonicString
 * @returns {*}
 */
declare function getPrivateKeyByMnemonic(mnemonicString: any): any;
/**
 * @param privateKey
 * @returns {*}
 */
declare function getAddressByPrivateKeySync(privateKey: any): any;
declare function getTxFee(utxos: any, address: any, coins: any, feePerByte: any, constantPart: any): Promise<number>;
declare function prepareSignedTx(utxos: any, address: any, changeAddress: any, coins: any, privateKey: any, fee: any): Promise<{
    txHash: any;
    txBody: any;
    cbor: any;
}>;
/**
 * @param address
 * @returns {boolean}
 */
declare function validateAddress(address: any): boolean;
declare function getHDKey(privateKey: any): Buffer<ArrayBufferLike>;

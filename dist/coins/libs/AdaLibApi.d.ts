export function shelleyTxEqual(req1: any, req2: any): boolean;
export default class AdaLibApi {
    constructor(cardanoWalletV2: any, cardanoWalletV4: any, feeParams: any);
    cardano: any;
    legacyLib: any;
    cip1852Account: any;
    legacyAccount: any;
    protocolParams: {
        linearFee: any;
        minimumUtxoVal: any;
        poolDeposit: any;
        keyDeposit: any;
        coinsPerUtxo: any;
    };
    legacyCrypto: {
        HDNode: ({ secret, secretKey, publicKey, chainCode }: {
            secret: any;
            secretKey: any;
            publicKey: any;
            chainCode: any;
        }) => {
            secretKey: any;
            publicKey: any;
            chainCode: any;
            extendedPublicKey: Buffer<ArrayBuffer>;
            toBuffer: () => Buffer<ArrayBuffer>;
            toString: () => string;
        };
        deriveChildHdNode: (hdNode: any, childIndex: any) => {
            secretKey: any;
            publicKey: any;
            chainCode: any;
            extendedPublicKey: Buffer<ArrayBuffer>;
            toBuffer: () => Buffer<ArrayBuffer>;
            toString: () => string;
        };
    };
    getCip1852AccountFromMnemonic(mnemonicString: any): any;
    getCip1852AccountFromPrivateKey(privateKey: any): any;
    getLegacyAccountFromMnemonic(mnemonicString: any): any;
    /**
     * return private key from mnemonic string
     * @param mnemonicString
     * @returns {*}
     */
    getPrivateKeyByMnemonic(mnemonicString: any): any;
    getLegacyPrivateKeyByMnemonic(mnemonicString: any): Promise<any>;
    getLegacyAddressByPrivateKeySync(legacyPrivateKey: any): any;
    getHDPassphrase(privateKey: any): Buffer<ArrayBufferLike>;
    getAddressByPrivateKey(cip?: undefined): Promise<any>;
    validateShelleyPrivateKey(privateKey: any): any;
    validateShelleyAddress(address: any): any;
    validateAddress(address: any): any;
    normalizeToAddress(addr: any): any;
    newAdaUnsignedTx(receiver: any, amount: any, changeAdaAddr: any, allUtxos: any, slotNo: any, certs: any, withdrawals: any): {
        senderUtxos: any[];
        txBuilder: any;
        changeAddr: {
            address: any;
            value: string;
        }[];
    };
    findSuitableInputs(utxo: any[] | undefined, spendableAmount: any): any[];
    newAdaUnsignedTxFromUtxo(receiver: any, amount: any, changeAdaAddr: any, utxos: any, protocolParams: {
        linearFee: any;
        minimumUtxoVal: any;
        poolDeposit: any;
        keyDeposit: any;
        coinsPerUtxo: any;
    } | undefined, ttl: number | undefined, certs: any, withdrawals: any): {
        senderUtxos: any[];
        txBuilder: any;
        changeAddr: {
            address: any;
            value: string;
        }[];
    };
    addUtxoInput(txBuilder: any, input: any): void;
    utxoToTxInput(utxo: any): any;
    getCardanoAddrKeyHash(addr: any): any;
    signTransaction(signRequest: any, signingKey: any, legacyAccount: any): {
        rawtx: any;
        txid: string;
    };
    addWitnesses({ txBody, uniqueUtxo, keys }: {
        txBody: any;
        uniqueUtxo: any;
        keys: any;
    }): any;
    estimateFee({ address, amount, outputs, ttl, certs }: {
        address: any;
        amount: any;
        outputs: any;
        ttl: any;
        certs: any;
    }): any;
    createTransaction({ address, amount, changeAddress, utxo, slotNo, legacyAccount, cip }: {
        address: any;
        amount: any;
        changeAddress: any;
        utxo: any;
        slotNo: any;
        legacyAccount: any;
        cip: any;
    }): {
        rawtx: any;
        txid: string;
    };
    createStakeRegistrationCertificate(stakeCredential: any): any;
    createStakeDeregistrationCertificate(stakeCredential: any): any;
    createStakeDelegationCertificate(stakeCredential: any, keyhash: any): any;
    createDelegationTransaction({ paymentAddress, utxo, slotNo, poolId, stakeAddressRegistered }: {
        paymentAddress: any;
        utxo: any;
        slotNo: any;
        poolId: any;
        stakeAddressRegistered: any;
    }): {
        rawtx: any;
        txid: string;
    };
    getRewardAddressHexFromAddressStr(address: any): string;
    createWithdrawalTransaction({ paymentAddress, utxo, slotNo, rewardAddress, amountToWithdraw }: {
        paymentAddress: any;
        utxo: any;
        slotNo: any;
        rewardAddress: any;
        amountToWithdraw: any;
    }): {
        rawtx: any;
        txid: string;
    };
    getRewardAddress(address: any): any;
}

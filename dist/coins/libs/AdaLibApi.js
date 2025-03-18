import base58 from 'base-58';
import bech32 from 'bech32';
import BigNumber from 'bignumber.js';
import bip39 from 'bip39';
import bs58 from 'bs58check';
import cardanoCrypto from 'cardano-crypto.js';
import { pbkdf2Sync } from 'pbkdf2';
const DUST_AMOUNT = '1000000';
const HARDENED_THRESHOLD = 0x80000000;
const legacyDerivationPath = [HARDENED_THRESHOLD, HARDENED_THRESHOLD];
const defaultTtlOffset = 21600;
const cip1852 = 1852;
const coinType = 1815;
const chainDerivation = {
    EXTERNAL: 0,
    INTERNAL: 1,
    CHIMERIC: 2,
};
const MAINNET_ID = 1;
const DECIMAL_PLACES = 6;
const DECIMAL = 10;
function getAdaCurrencyMeta() {
    const decimalPlaces = new BigNumber(DECIMAL_PLACES);
    return {
        primaryTicker: 'ADA',
        decimalPlaces,
        totalSupply: new BigNumber('45 000 000 000'.replace(/ /g, ''), DECIMAL).times(new BigNumber(DECIMAL).pow(decimalPlaces)),
    };
}
const harden = (num) => {
    return HARDENED_THRESHOLD + num;
};
class HaskellShelleyTxSignRequest {
    constructor(signRequest, cardano) {
        this.cardano = cardano;
        this.signRequest = signRequest;
    }
    totalInput(shift) {
        const inputTotal = this.signRequest.unsignedTx
            .get_implicit_input()
            .checked_add(this.signRequest.unsignedTx.get_explicit_input());
        const change = this.signRequest.changeAddr
            .map((val) => new BigNumber(val.value || new BigNumber(0)))
            .reduce((sum, val) => sum.plus(val), new BigNumber(0));
        const result = new BigNumber(inputTotal.to_str()).minus(change);
        if (shift) {
            return result.shiftedBy(-getAdaCurrencyMeta().decimalPlaces.toNumber());
        }
        return result;
    }
    totalOutput(shift) {
        const totalOutput = this.signRequest.unsignedTx.get_explicit_output();
        const result = new BigNumber(totalOutput.to_str());
        if (shift) {
            return result.shiftedBy(-getAdaCurrencyMeta().decimalPlaces.toNumber());
        }
        return result;
    }
    fee(shift) {
        const fee = this.signRequest.unsignedTx.get_fee_or_calc();
        const result = new BigNumber(fee.to_str());
        if (shift) {
            return result.shiftedBy(-getAdaCurrencyMeta().decimalPlaces.toNumber());
        }
        return result;
    }
    receivers(includeChange) {
        const outputs = this.signRequest.unsignedTx.build().outputs();
        const outputStrings = [];
        for (let index = 0; index < outputs.len(); index += 1) {
            outputStrings.push(this.toHexOrBase58(outputs.get(index).address()));
        }
        if (!includeChange) {
            const changeAddrs = this.signRequest.changeAddr.map((change) => change.address);
            return outputStrings.filter((addr) => !changeAddrs.includes(addr));
        }
        return outputStrings;
    }
    uniqueSenderAddresses() {
        return Array.from(new Set(this.signRequest.senderUtxos.map((utxo) => utxo.receiver)));
    }
    isEqual(tx) {
        if (tx === null) {
            return false;
        }
        if (!(tx instanceof this.cardano.TransactionBuilder)) {
            return false;
        }
        return shelleyTxEqual(this.signRequest.unsignedTx, tx);
    }
    toHexOrBase58(address) {
        const asByron = this.cardano.ByronAddress.from_address(address);
        if (asByron === null) {
            return Buffer.from(address.to_bytes()).toString('hex');
        }
        return asByron.to_base58();
    }
    self() {
        return this.signRequest;
    }
}
export function shelleyTxEqual(req1, req2) {
    return Buffer.from(req1.build().to_bytes()).toString('hex') === Buffer.from(req2.build().to_bytes()).toString('hex');
}
export default class AdaLibApi {
    constructor(cardanoWalletV2, cardanoWalletV4, feeParams) {
        this.cardano = cardanoWalletV4;
        this.legacyLib = cardanoWalletV2;
        this.cip1852Account = undefined;
        this.legacyAccount = undefined;
        this.protocolParams = {
            linearFee: this.cardano.LinearFee.new(this.cardano.BigNum.from_str(String(feeParams.feeCoefficient)), this.cardano.BigNum.from_str(String(feeParams.feeConst))),
            minimumUtxoVal: this.cardano.BigNum.from_str('1'), // @TODO hardcoded until staking
            poolDeposit: this.cardano.BigNum.from_str('50000000'), // @TODO hardcoded until staking
            keyDeposit: this.cardano.BigNum.from_str('2000000'), // @TODO hardcoded until staking
            coinsPerUtxo: this.cardano.BigNum.from_str('34482'),
        };
        this.legacyCrypto = {
            HDNode: ({ secret, secretKey, publicKey, chainCode }) => {
                /*
                 * HD node groups secretKey, publicKey and chainCode
                 * can be initialized from Buffers or single string
                 * @param secretKey as Buffer
                 * @param publicKey as Buffer
                 * @param chainCode as Buffer
                 */
                if (secret) {
                    secretKey = secret.slice(0, 64);
                    publicKey = secret.slice(64, 96);
                    chainCode = secret.slice(96, 128);
                }
                else {
                    secret = Buffer.concat([secretKey, publicKey, chainCode]);
                }
                const extendedPublicKey = Buffer.concat([publicKey, chainCode], 64);
                function toBuffer() {
                    return Buffer.concat([secretKey, extendedPublicKey]);
                }
                function toString() {
                    return toBuffer().toString('hex');
                }
                return {
                    secretKey,
                    publicKey,
                    chainCode,
                    extendedPublicKey,
                    toBuffer,
                    toString,
                };
            },
            deriveChildHdNode: (hdNode, childIndex) => {
                const result = cardanoCrypto.derivePrivate(hdNode.toBuffer(), childIndex, 1);
                return this.legacyCrypto.HDNode({
                    secretKey: result.slice(0, 64),
                    publicKey: result.slice(64, 96),
                    chainCode: result.slice(96, 128),
                });
            },
        };
    }
    getCip1852AccountFromMnemonic(mnemonicString) {
        const entropy = bip39.mnemonicToEntropy(mnemonicString);
        const rootKey = this.cardano.Bip32PrivateKey.from_bip39_entropy(Buffer.from(entropy, 'hex'), Buffer.from(''));
        return rootKey.derive(harden(cip1852)).derive(harden(coinType)).derive(harden(0));
    }
    getCip1852AccountFromPrivateKey(privateKey) {
        this.cip1852Account = this.cardano.Bip32PrivateKey.from_bech32(privateKey);
        return this.cip1852Account;
    }
    getLegacyAccountFromMnemonic(mnemonicString) {
        const entropy = this.legacyLib.Entropy.from_english_mnemonics(mnemonicString);
        this.legacyAccount = this.legacyLib.DaedalusWallet.recover(entropy);
        return this.legacyAccount;
    }
    /**
     * return private key from mnemonic string
     * @param mnemonicString
     * @returns {*}
     */
    async getPrivateKeyByMnemonic(mnemonicString) {
        const cip1852Account = this.getCip1852AccountFromMnemonic(mnemonicString);
        this.cip1852Account = cip1852Account;
        return cip1852Account.to_bech32();
    }
    async getLegacyPrivateKeyByMnemonic(mnemonicString) {
        const walletSecret = await cardanoCrypto.mnemonicToRootKeypair(mnemonicString, 1);
        return bs58.encode(walletSecret);
    }
    getLegacyAddressByPrivateKeySync(legacyPrivateKey) {
        const { HDNode, deriveChildHdNode } = this.legacyCrypto;
        const walletSecret = bs58.decode(legacyPrivateKey);
        const masterHDNode = HDNode({ secret: walletSecret });
        const xpub = legacyDerivationPath.reduce(deriveChildHdNode, masterHDNode).extendedPublicKey;
        const hdPassphrase = this.getHDPassphrase(legacyPrivateKey);
        return base58.encode(cardanoCrypto.packBootstrapAddress(legacyDerivationPath, xpub, hdPassphrase, 1, 764824073));
    }
    getHDPassphrase(privateKey) {
        const walletSecret = bs58.decode(privateKey);
        const masterHDNode = this.legacyCrypto.HDNode({ secret: walletSecret });
        return pbkdf2Sync(masterHDNode.extendedPublicKey, 'address-hashing', 500, 32, 'sha512');
    }
    async getAddressByPrivateKey(cip = undefined) {
        const account = cip || this.cip1852Account;
        const utxoPubKey = account.derive(chainDerivation.EXTERNAL).derive(0).to_public();
        const stakeKey = account.derive(chainDerivation.CHIMERIC).derive(0).to_public();
        const baseAddr = this.cardano.BaseAddress.new(MAINNET_ID, // 1 for mainnet, 0 for testnet
        this.cardano.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()), this.cardano.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash()));
        return baseAddr.to_address().to_bech32();
    }
    validateShelleyPrivateKey(privateKey) {
        try {
            return this.cardano.Bip32PrivateKey.from_bech32(privateKey);
        }
        catch (error) {
            return false;
        }
    }
    validateShelleyAddress(address) {
        if (!address) {
            return false;
        }
        try {
            return this.cardano.Address.from_bech32(address);
        }
        catch (error) {
            return false;
        }
    }
    validateAddress(address) {
        let valid;
        if (!address) {
            return false;
        }
        try {
            valid = this.cardano.Address.from_bech32(address);
            if (valid) {
                return valid;
            }
        }
        catch (error) {
            valid = false;
        }
        try {
            valid = this.cardano.ByronAddress.from_base58(address);
        }
        catch (error) {
            valid = false;
        }
        return valid;
    }
    normalizeToAddress(addr) {
        // in Shelley, addresses can be base16, bech32 or base58
        // this function, we try parsing in all encodings possible
        // 1) Try converting from base58
        if (this.cardano.ByronAddress.is_valid(addr)) {
            return this.cardano.ByronAddress.from_base58(addr).to_address();
        }
        return this.cardano.Address.from_bech32(addr);
    }
    newAdaUnsignedTx(receiver, amount, changeAdaAddr, allUtxos, slotNo, certs, withdrawals) {
        const ttl = slotNo + defaultTtlOffset;
        const addressingMap = new Map();
        for (const utxo of allUtxos) {
            addressingMap.set({
                amount: utxo.amount,
                receiver: utxo.receiver,
                tx_hash: utxo.tx_hash,
                tx_index: utxo.tx_index,
                utxo_id: utxo.tx_hash + utxo.tx_index,
            }, utxo);
        }
        const unsignedTxResponse = this.newAdaUnsignedTxFromUtxo(receiver, amount, changeAdaAddr, Array.from(addressingMap.keys()), this.protocolParams, ttl, certs, withdrawals);
        const addressedUtxos = unsignedTxResponse.senderUtxos.map((utxo) => {
            const addressedUtxo = addressingMap.get(utxo);
            if (addressedUtxo === null) {
                throw new Error('[newAdaUnsignedTx] utxo reference was changed. Should not happen');
            }
            return addressedUtxo;
        });
        return {
            senderUtxos: addressedUtxos,
            txBuilder: unsignedTxResponse.txBuilder,
            changeAddr: unsignedTxResponse.changeAddr,
        };
    }
    findSuitableInputs(utxo = [], spendableAmount) {
        if (utxo.length <= 0) {
            throw new Error('[findSuitableInputs]: UTXOs must be provided');
        }
        /**
         * Target amount = spendable + fees
         */
        let target = new BigNumber(spendableAmount);
        const zero = new BigNumber(0);
        const neg = new BigNumber(-1);
        const minOutput = DUST_AMOUNT ? new BigNumber(DUST_AMOUNT) : zero;
        const suitable = [];
        /**
         * Firstly sort UTXOs from smaller to bigger
         * calculate last index of sorted array
         *
         */
        const sorted = [...utxo.sort((first, second) => Number(first.amount) - Number(second.amount))];
        let lastIndex = sorted.length - 1;
        /**
         * While target amount not filled by inputs - iterate thru
         * or if change is less than minimum dust amount
         */
        while (target.gt(zero) || (target.lt(zero) && target.times(neg).lt(minOutput))) {
            /**
             * If target amount is not filled
             * And there is no more available inputs
             * throw error
             */
            if (lastIndex < 0) {
                // @TODO target here can be negative IMPORTANT
                break;
            }
            /**
             * Find suitable input that can cover target amount
             */
            const suitInputIndex = sorted.findIndex((input) => new BigNumber(input.amount).gte(target));
            if (suitInputIndex >= 0) {
                /**
                 * If no suitable input was found - take the last (bigger) one
                 * and replace it from sorted UTXOs as used
                 */
                target = target.minus(new BigNumber(sorted[suitInputIndex].amount));
                suitable.push(...sorted.splice(suitInputIndex, 1));
            }
            else {
                /**
                 * If suitable input was found - take it
                 * and replace it from sorted UTXOs as used
                 */
                target = target.minus(new BigNumber(sorted[lastIndex].amount));
                suitable.push(...sorted.splice(lastIndex, 1));
            }
            /**
             * recalculate last element index of sorted UTXOs
             */
            lastIndex = sorted.length - 1;
        }
        return suitable;
    }
    newAdaUnsignedTxFromUtxo(receiver, amount, changeAdaAddr, utxos, protocolParams = this.protocolParams, ttl = defaultTtlOffset, certs, withdrawals) {
        const wasmReceiver = this.normalizeToAddress(receiver);
        if (wasmReceiver === null) {
            throw new Error('[newAdaUnsignedTxFromUtxo] receiver not a valid Shelley address');
        }
        const txBuilderConfig = this.cardano.TransactionBuilderConfigBuilder.new()
            .fee_algo(this.protocolParams.linearFee)
            .pool_deposit(this.protocolParams.poolDeposit)
            .key_deposit(this.protocolParams.keyDeposit)
            .max_value_size(4000)
            .max_tx_size(8000)
            .coins_per_utxo_word(this.protocolParams.minimumUtxoVal)
            .build();
        const txBuilder = this.cardano.TransactionBuilder.new(txBuilderConfig);
        txBuilder.set_ttl(ttl);
        const isDelegation = amount === null && certs; // if delegation then send all to self and add certificates
        const isClaim = amount === null;
        if (!isDelegation && !isClaim) {
            txBuilder.add_output(this.cardano.TransactionOutput.new(wasmReceiver, this.cardano.Value.new(this.cardano.BigNum.from_str(amount))));
        }
        if (certs) {
            txBuilder.set_certs(certs);
        }
        if (withdrawals) {
            txBuilder.set_withdrawals(withdrawals);
        }
        let targetAmount;
        if (isDelegation) {
            targetAmount = new BigNumber(2500000);
        }
        else {
            const outputVal = txBuilder.get_explicit_output().checked_add(this.cardano.Value.new(txBuilder.min_fee())).coin();
            targetAmount = new BigNumber(outputVal.to_str());
        }
        // add utxos until we have enough to send the transaction
        const suitableInputs = this.findSuitableInputs(utxos, targetAmount, txBuilder);
        suitableInputs.forEach((input) => {
            this.addUtxoInput(txBuilder, input);
        });
        const changeAddr = (() => {
            if (changeAdaAddr === null) {
                txBuilder.set_fee(txBuilder.min_fee());
                return [];
            }
            const oldOutput = this.cardano.Value.new(this.cardano.BigNum.from_str(targetAmount.toString()));
            const wasmChange = this.normalizeToAddress(changeAdaAddr);
            if (wasmChange === null) {
                throw new Error('[newAdaUnsignedTxFromUtxo] change not a valid Shelley address');
            }
            const changeValue = new BigNumber(txBuilder.get_explicit_input().checked_sub(oldOutput).coin().to_str());
            let changeWasAdded = false;
            try {
                if (changeValue.toNumber() > 0) {
                    txBuilder.add_change_if_needed(wasmChange);
                    changeWasAdded = true;
                }
            }
            catch (error) {
                console.warn(error);
            }
            return changeWasAdded
                ? [
                    {
                        address: changeAdaAddr,
                        value: changeValue.toString(),
                    },
                ]
                : [];
        })();
        return {
            senderUtxos: suitableInputs,
            txBuilder,
            changeAddr,
        };
    }
    addUtxoInput(txBuilder, input) {
        const wasmInput = this.normalizeToAddress(input.receiver);
        const keyHash = this.getCardanoAddrKeyHash(wasmInput);
        if (keyHash === null) {
            const byronAddr = this.cardano.ByronAddress.from_address(wasmInput);
            if (byronAddr === null) {
                throw new Error('Add input should never happen: non-byron address without key hash');
            }
            txBuilder.add_bootstrap_input(byronAddr, this.utxoToTxInput(input), this.cardano.Value.new(this.cardano.BigNum.from_str(input.amount)));
            return;
        }
        if (keyHash === undefined) {
            throw new Error('addUtxoInput script inputs not expected');
        }
        txBuilder.add_key_input(keyHash, this.utxoToTxInput(input), this.cardano.Value.new(this.cardano.BigNum.from_str(input.amount)));
    }
    utxoToTxInput(utxo) {
        return this.cardano.TransactionInput.new(this.cardano.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, 'hex')), utxo.tx_index);
    }
    getCardanoAddrKeyHash(addr) {
        {
            const byronAddr = this.cardano.ByronAddress.from_address(addr);
            if (byronAddr) {
                return null;
            }
        }
        {
            const baseAddr = this.cardano.BaseAddress.from_address(addr);
            if (baseAddr) {
                return baseAddr.payment_cred().to_keyhash();
            }
        }
        {
            const ptrAddr = this.cardano.PointerAddress.from_address(addr);
            if (ptrAddr) {
                return ptrAddr.payment_cred().to_keyhash();
            }
        }
        {
            const enterpriseAddr = this.cardano.EnterpriseAddress.from_address(addr);
            if (enterpriseAddr) {
                return enterpriseAddr.payment_cred().to_keyhash();
            }
        }
        {
            const rewardAddr = this.cardano.RewardAddress.from_address(addr);
            if (rewardAddr) {
                return rewardAddr.payment_cred().to_keyhash();
            }
        }
        throw new Error(' unknown address type');
    }
    signTransaction(signRequest, signingKey = this.cip1852Account, legacyAccount) {
        const req = new HaskellShelleyTxSignRequest({
            senderUtxos: signRequest.senderUtxos,
            unsignedTx: signRequest.txBuilder,
            changeAddr: signRequest.changeAddr,
        }, this.cardano);
        const checker = this.legacyLib.DaedalusAddressChecker.new(this.legacyAccount || legacyAccount);
        let byronAddr;
        const seenByronKeys = new Set();
        const seenKeyHashes = new Set();
        const deduped = []; // AddressedUtxo
        for (const senderUtxo of signRequest.senderUtxos) {
            const wasmAddr = this.normalizeToAddress(senderUtxo.receiver);
            if (wasmAddr === null) {
                throw new Error('[signTransaction] utxo not a valid Shelley address');
            }
            const keyHash = this.getCardanoAddrKeyHash(wasmAddr);
            const addrHex = Buffer.from(wasmAddr.to_bytes()).toString('hex');
            if (keyHash === null) {
                byronAddr = this.legacyLib.Address.from_base58(senderUtxo.receiver);
                if (!seenByronKeys.has(addrHex)) {
                    seenByronKeys.add(addrHex);
                    deduped.push(senderUtxo);
                }
                continue;
            }
            if (keyHash === undefined) {
                throw new Error('[signTransaction] cannot sign script inputs');
            }
            {
                const keyHex = Buffer.from(keyHash.to_bytes()).toString('hex');
                if (!seenKeyHashes.has(keyHex)) {
                    seenKeyHashes.add(keyHex);
                    deduped.push(senderUtxo);
                }
            }
        }
        const txBody = req.signRequest.unsignedTx instanceof this.cardano.TransactionBuilder
            ? req.signRequest.unsignedTx.build()
            : req.signRequest.unsignedTx;
        const keys = {
            shelleyKey: signingKey.derive(0).derive(0).to_raw_key(),
            shelleyStakeKey: signingKey.derive(2).derive(0).to_raw_key(),
        };
        if (byronAddr) {
            keys.byronKey = Buffer.from(checker.check_address(byronAddr).private_key().to_hex(), 'hex');
        }
        const witnessSet = this.addWitnesses({ txBody, uniqueUtxo: deduped, keys });
        return {
            rawtx: this.cardano.Transaction.new(txBody, witnessSet).to_bytes(),
            txid: Buffer.from(this.cardano.hash_transaction(txBody).to_bytes()).toString('hex'),
        };
    }
    addWitnesses({ txBody, uniqueUtxo, keys }) {
        const { byronKey, shelleyKey, shelleyStakeKey } = keys;
        // sign the transactions
        const txHash = this.cardano.hash_transaction(txBody);
        const bootstrapWits = this.cardano.BootstrapWitnesses.new();
        const vkeyWits = this.cardano.Vkeywitnesses.new();
        const witSet = this.cardano.TransactionWitnessSet.new();
        for (let index = 0; index < uniqueUtxo.length; index += 1) {
            const wasmAddr = this.normalizeToAddress(uniqueUtxo[index].receiver);
            if (wasmAddr === null) {
                throw new Error('[addWitnesses] utxo not a valid Shelley address');
            }
            const byronAddr = this.cardano.ByronAddress.from_address(wasmAddr);
            if (byronAddr) {
                const bootstrapWit = this.cardano.make_daedalus_bootstrap_witness(txHash, byronAddr, this.cardano.LegacyDaedalusPrivateKey.from_bytes(byronKey));
                bootstrapWits.add(bootstrapWit);
            }
            else {
                const vkeyWitness = this.cardano.make_vkey_witness(txHash, shelleyKey);
                const vkeyStakeWitness = this.cardano.make_vkey_witness(txHash, shelleyStakeKey);
                vkeyWits.add(vkeyWitness);
                vkeyWits.add(vkeyStakeWitness);
            }
        }
        if (bootstrapWits.len() > 0) {
            witSet.set_bootstraps(bootstrapWits);
        }
        if (vkeyWits.len() > 0) {
            witSet.set_vkeys(vkeyWits);
        }
        return witSet;
    }
    estimateFee({ address, amount, outputs, ttl, certs }) {
        const txBuilderConfig = this.cardano.TransactionBuilderConfigBuilder.new()
            .fee_algo(this.protocolParams.linearFee)
            .pool_deposit(this.protocolParams.poolDeposit)
            .key_deposit(this.protocolParams.keyDeposit)
            .max_value_size(4000)
            .max_tx_size(8000)
            .coins_per_utxo_byte(this.protocolParams.minimumUtxoVal)
            .build();
        const txBuilder = this.cardano.TransactionBuilder.new(txBuilderConfig);
        const wasmReceiver = this.normalizeToAddress(address);
        txBuilder.add_output(this.cardano.TransactionOutput.new(wasmReceiver, this.cardano.Value.new(this.cardano.BigNum.from_str(String(amount)))));
        outputs.forEach((out) => {
            this.addUtxoInput(txBuilder, out);
        });
        txBuilder.set_ttl(ttl + defaultTtlOffset);
        if (certs) {
            txBuilder.set_certs(certs);
        }
        return txBuilder.min_fee().to_str();
    }
    createTransaction({ address, amount, changeAddress, utxo, slotNo, legacyAccount, cip }) {
        const signRequest = this.newAdaUnsignedTx(address, amount, changeAddress, utxo, slotNo);
        const signedTx = this.signTransaction(signRequest, cip, legacyAccount);
        return signedTx;
    }
    createStakeRegistrationCertificate(stakeCredential /*: Cardano.StakeCredential */) {
        const stakeReg = this.cardano.StakeRegistration.new(stakeCredential);
        return this.cardano.Certificate.new_stake_registration(stakeReg);
    }
    createStakeDeregistrationCertificate(stakeCredential /*: Cardano.StakeCredential */) {
        const stakeDeReg = this.cardano.StakeDeregistration.new(stakeCredential);
        return this.cardano.Certificate.new_stake_deregistration(stakeDeReg);
    }
    createStakeDelegationCertificate(stakeCredential /*: Cardano.StakeCredential */, keyhash /*: Cardano.Ed25519KeyHash */) {
        const stakeReg = this.cardano.StakeDelegation.new(stakeCredential, keyhash);
        return this.cardano.Certificate.new_stake_delegation(stakeReg);
    }
    createDelegationTransaction({ paymentAddress, utxo, slotNo, poolId, stakeAddressRegistered }) {
        const cardanoAddress = this.cardano.Address.from_bech32(paymentAddress);
        const cardanoBaseAddress = this.cardano.BaseAddress.from_address(cardanoAddress);
        const certs = this.cardano.Certificates.new();
        let poolBytes;
        try {
            const decoded = bech32.decode(poolId);
            poolBytes = Buffer.from(bech32.fromWords(decoded.words));
        }
        catch {
            poolBytes = Buffer.from(poolId, 'hex');
        }
        const edhash = this.cardano.Ed25519KeyHash.from_bytes(poolBytes);
        if (!stakeAddressRegistered) {
            certs.add(this.createStakeRegistrationCertificate(cardanoBaseAddress.stake_cred()));
        }
        certs.add(this.createStakeDelegationCertificate(cardanoBaseAddress.stake_cred(), edhash));
        const signRequest = this.newAdaUnsignedTx(paymentAddress /* as reciever - sending to self */, null /* amount is null - send all */, paymentAddress /* as changeAddress */, utxo, slotNo, certs);
        const signedTx = this.signTransaction(signRequest);
        return signedTx;
    }
    getRewardAddressHexFromAddressStr(address) {
        return Buffer.from(this.getRewardAddress(address).to_address().to_bytes()).toString('hex');
    }
    createWithdrawalTransaction({ paymentAddress, utxo, slotNo, rewardAddress, amountToWithdraw }) {
        const withdrawals = this.cardano.Withdrawals.new();
        withdrawals.insert(rewardAddress, this.cardano.BigNum.from_str(amountToWithdraw));
        const signRequest = this.newAdaUnsignedTx(paymentAddress /* as reciever - sending to self */, null /* amount is null - send all */, paymentAddress /* as changeAddress */, utxo, slotNo, undefined, withdrawals);
        const signedTx = this.signTransaction(signRequest);
        return signedTx;
    }
    getRewardAddress(address) {
        const cAddress = this.cardano.Address.from_bech32(address);
        const bAddress = this.cardano.BaseAddress.from_address(cAddress);
        const paymentCred = bAddress.stake_cred();
        const rewardAddress = this.cardano.RewardAddress.new(MAINNET_ID, paymentCred);
        return rewardAddress;
    }
}
//# sourceMappingURL=AdaLibApi.js.map
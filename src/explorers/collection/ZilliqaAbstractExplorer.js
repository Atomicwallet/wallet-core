import { fromBech32Address, toBech32Address, toChecksumAddress } from '@zilliqa-js/crypto';

import Explorer from '../Explorer';

class ZilliqaAbstractExplorer extends Explorer {
  getAllowedTickers() {
    return ['ZIL'];
  }

  getBech32Address(checksumAddr) {
    return toBech32Address(checksumAddr);
  }

  getValidChecksumAddress(address) {
    let checksumAddr = '';

    try {
      checksumAddr = toChecksumAddress(address);
    } catch (error) {
      checksumAddr = toChecksumAddress(fromBech32Address(address));
    }

    return checksumAddr.toLowerCase();
  }

  /**
   * Returns valid checksum addr
   * @param address
   * @returns {string}
   */
  toValidChecksumAddress(address) {
    return this.getValidChecksumAddress(address).replace(/^0x/, '');
  }
}

export default ZilliqaAbstractExplorer;

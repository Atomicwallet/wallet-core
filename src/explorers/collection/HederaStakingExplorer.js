import { AccountUpdateTransaction, PrivateKey } from 'hedera-sdk-v2'

import Explorer from '../Explorer'

class HederaStakingExplorer extends Explorer {
  getAllowedTickers () {
    return ['HBAR']
  }

  getInfoParams () {
    return { limit: 1 }
  }

  getInfoUrl (address) {
    return `accounts/${address}`
  }

  /**
   * Creates and sends stake tx
   * @param {Object} wallet The HBAR wallet
   * @param {number|string} nodeId The staked node id
   * @return {Promise<string>} the tx hash
   */
  stake (wallet, nodeId, privateKey) {
    return this.#sendTx(this.#createAccountUpdateTx(wallet).setStakedNodeId(nodeId).setDeclineStakingReward(false),
      wallet, privateKey)
  }

  /**
   * Creates and sends stake tx
   * @param {Object} wallet The HBAR wallet
   * @return {Promise<string>} the tx hash
   */
  unstake (wallet, privateKey) {
    return this.#sendTx(this.#createAccountUpdateTx(wallet).clearStakedNodeId(), wallet, privateKey)
  }

  #createAccountUpdateTx ({ address }) {
    return new AccountUpdateTransaction().setAccountId(address)
  }

  async #sendTx (tx, wallet, privateKey) {
    const client = await wallet.getClient()
    const frozen = await tx.freezeWith(client)
    const signedTx = await frozen.sign(PrivateKey.fromString(privateKey))

    return signedTx.execute(client)
  }
}

export default HederaStakingExplorer

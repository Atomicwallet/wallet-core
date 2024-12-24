import Explorer from '../Explorer'

class PolkadotSidecarExplorer extends Explorer {
  getAllowedTickers () {
    return ['DOT']
  }

  getInfoUrl (address) {
    return `accounts/${address}/balance-info`
  }

  getLatestBlockUrl () {
    return 'blocks/head'
  }

  getSendTransactionUrl () {
    return 'transaction'
  }

  getSendTransactionParam () {
    return 'tx'
  }

  getTxMetaUrl () {
    return 'transaction/material'
  }

  getTxMetaMethod () {
    return super.getInfoMethod()
  }

  getTxMetaParams () {
    return {
      noMeta: false,
    }
  }

  getMetadataUrl () {
    return 'runtime/metadata'
  }

  getMetadataMethod () {
    return super.getInfoMethod()
  }

  getMetadata () {
    return this.request(
      this.getMetadataUrl(),
      this.getTxMetaMethod(),
    )
  }

  getTxMeta () {
    return this.request(
      this.getTxMetaUrl(),
      this.getTxMetaMethod(),
      this.getTxMetaParams()
    )
  }

  async sendTransaction ({ rawtx }) {
    return super.sendTransaction(rawtx)
  }

  modifyInfoResponse (response) {
    if (!response) {
      return {}
    }

    const { free, frozen, nonce } = response

    const balance = new this.wallet.BN(free).sub(new this.wallet.BN(frozen)).toString()
    const balances = {
      available: this.wallet.toCurrencyUnit(balance),
      free,
      frozen,
    }

    return {
      balance,
      balances,
      nonce,
    }
  }

  modifySendTransactionResponse (response) {
    return {
      txid: response.hash,
    }
  }
}

export default PolkadotSidecarExplorer

import { ExplorerRequestError } from 'src/errors';
import { EXPLORER_API_ERROR } from 'src/utils/const';

import Explorer from '../Explorer';

class EOSApiExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.apiKey = args[3];
  }

  getAllowedTickers() {
    return ['EOS'];
  }

  /**
   * @param {string} account
   * @returns {Promise<Boolean>}
   */
  async validateNewAccountName(account) {
    const response = await this.request(this.config.baseUrl, 'get', {
      module: 'account',
      action: 'get_account_info',
      apikey: this.apiKey,
      account,
    }).catch((error) => {
      throw new ExplorerRequestError({
        type: EXPLORER_API_ERROR,
        error,
        instance: this,
      });
    });

    if (response.data && response.data.permissions && response.data.permissions.length > 0) {
      return false;
    }
    this.wallet.address = account;
    return true;
  }
}

export default EOSApiExplorer;

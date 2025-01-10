import { ExplorerRequestError } from 'src/errors';
import Explorer from 'src/explorers/explorer';
import { SEND_TRANSACTION_TYPE } from 'src/utils/const';

class AtomicExplorer extends Explorer {
  getAllowedTickers() {
    return ['KMD'];
  }

  async getInfo(address) {
    const response = await this.request(`rewards?address=${address}`);

    if (response.msg !== 'success') {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(JSON.stringify(response)),
        instance: this,
      });
    }

    return {
      balance: response.result.balanceSats,
      balances: response.result,
    };
  }

  async getRewards(address) {
    const response = await this.request(`rewards?address=${address}`);

    if (response.msg !== 'success') {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(JSON.stringify(response)),
        instance: this,
      });
    }

    return response.result.interest;
  }
}

export default AtomicExplorer;

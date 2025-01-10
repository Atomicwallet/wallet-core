import BigNumber from 'bignumber.js';
import lodash from 'lodash';

// import configManager from '../ConfigManager'
import Explorer from '../Explorer';
// import logger from '../Logger'

const TOKENS_LIST_URL = 'https://assets.terra.money/cw20/tokens.json';
const TOKENS_PER_REQ_LIMIT = 40;

export default class TerraMantleExplorer extends Explorer {
  getAllowedTickers() {
    return ['LUNA', 'LUNC'];
  }

  async getUserTokenList(userAddress, isClassic = false) {
    const limitPerRequest = TOKENS_PER_REQ_LIMIT;

    const tokens = Object.values(await this.getTokenList(isClassic));

    const queries = tokens.map(({ token }) => {
      const queryMsg = JSON.stringify(
        `{"balance": { "address" : "${userAddress}" } }`,
      );

      return `${token}: WasmContractsContractAddressStore(ContractAddress: "${token}", QueryMsg : ${queryMsg}) {\n Result\n }\n`;
    });

    const responses = await Promise.all(
      lodash.chunk(queries, limitPerRequest).map(async (chunk) =>
        this.request('/', 'POST', {
          operationName: null,
          variables: {},
          query: `{\n ${chunk.join()}}\n`,
        }),
      ),
    );

    return tokens
      .map((token) => {
        const hasToken = responses
          .map((response) => response.data)
          .filter(Boolean)
          .some((balances) => {
            try {
              const { balance } = JSON.parse(balances[token.token]?.Result);

              return new BigNumber(balance).isGreaterThan(0);
            } catch (error) {
              return false;
            }
          });

        return hasToken ? token : null;
      })
      .filter(Boolean);
  }

  async getTokenList(isClassic = false) {
    const res = await this.request(TOKENS_LIST_URL, 'GET');

    if (isClassic) {
      return res.classic;
    }

    return this.wallet.isTestnet() ? res.testnet : res.mainnet;
  }

  async getBannedTokensList() {
    let banned;

    // try {
    //   banned = await configManager.get('luna-tokens-banned')
    // } catch (error) {
    //   // logger.error({ instance: this, error })
    // }

    return Array.isArray(banned) ? banned : [];
  }
}

import { Token } from 'src/abstract';
import { UndeclaredAbstractMethodError } from 'src/errors';
import InternalError from 'src/errors/InternalError';
import { getTokenId, INTERNAL_ERROR } from 'src/utils';

const MAX_TICKER_LENGTH = 9;
const MAX_NAME_LENGTH = 30;
const TOKEN_SOURCE_USER = 'user';
const TOKEN_SOURCE_PREDEFINED_LIST = 'list';

/*

Token integration guide:

  1.    Extend coin from HasTokensMixin
  2.    Implement getTokenList in coin class
  2.1   Implement getTokenObject (serverToken, source='list') in coin class
  getTokenObject should return format described in jsdoc
  3.    Implement getUserTokenList in coin class
  3.1   Implement getTokenObject (serverToken, source='user') in coin class
  if user list format differs
  4.    Test, test, test
*/

const HasTokensMixin = (superclass) =>
  class extends superclass {
    constructor(config, db, configManager) {
      super(config, db, configManager);

      this.tokens = {};
    }

    /**
     * @param  {} txn - transaction context
     * @param  {} items - tokens to insert
     * @returns {Promise<items>} - items was inserted
     */
    async _insertBatchTokens(items) {
      const db = this.getDbTable('tokens');

      await db.batchPut(items);

      return items;
    }

    async _updateBatchTokens(tokens) {
      const promises = [];

      for (const token of tokens) {
        promises.push(this._updateToken(token));
      }

      await Promise.all(promises);

      return tokens;
    }

    async _updateToken(token) {
      const db = this.getDbTable('tokens');

      const tokenItem = await db
        .get({
          uniqueField: token.uniqueField,
        })
        .catch(() => {});

      if (tokenItem && tokenItem.id) {
        await db.update(tokenItem.id, token);

        return token;
      }

      return undefined;
    }

    async _removeToken(uniqueField) {
      const db = this.getDbTable('tokens');

      const tokenItem = await db
        .get({
          uniqueField,
        })
        .first()
        .catch(() => {});

      if (tokenItem && tokenItem.id) {
        await db.delete(tokenItem.id);
      }
    }

    /**
     * @param  {} parentTicker - tokens of what coin?
     * @returns {Promise<tokens>}  - an object with selected tokens rows
     */
    async loadTokensFromDb(parentTicker, filterFun = (token) => token.parentTicker === parentTicker) {
      const db = this.getDbTable('tokens');

      const allTokens = await db.getAll();

      return parentTicker ? allTokens.filter(filterFun) : allTokens;
    }

    /**
     * @param  {Array<Token{}>} tokens - array of token object to insert
     * @returns {Promise<tokens>} - inserted tokens
     */
    async insertTokensToDb(tokens) {
      const tokensForInsert = tokens
        .map((token) => {
          token.parentTicker = this.id;
          return token;
        })
        .filter((notEmpty) => notEmpty);

      const [uniques] = await this.getUniquesAndDuplicates(tokens);

      const filteredTokensToInsert = tokensForInsert.filter((token) => uniques[token.uniqueField] === undefined);

      await this._insertBatchTokens(
        // do not insert if this parentTicker+uniqueField already inserted
        filteredTokensToInsert,
      );

      return filteredTokensToInsert;
    }

    /**
     * @param  {Array<Token{}>} tokens - array of token object to update
     * @returns {Promise<updatedTokens>} - updated tokens
     */
    async updateTokensInDb(tokens, initialSource) {
      const rows = await this.loadTokensFromDb(this.id, (token) => [this.id, this.ticker].includes(token.parentTicker));

      const oldTokens = rows.map(({ uniqueField }) => uniqueField.toLowerCase());

      const tokensForUpdate = tokens.reduce((acc, { uniqueField, ticker, name, source, isCustom, ...rest }) => {
        if (oldTokens.includes(uniqueField.toLowerCase())) {
          if (source === 'list' && !isCustom) {
            acc.push({
              ...rest,
              uniqueField,
              ticker,
              name,
              source,
              isCustom,
              parentTicker: this.id,
            });
          } else {
            acc.push({ ...rest, uniqueField, source, parentTicker: this.id });
          }
        }

        return acc;
      }, []);

      await this._updateBatchTokens(tokensForUpdate);

      return tokensForUpdate;
    }

    /**
     * @param  {String} token uniqueField
     * @returns {Promise<>}
     */
    async removeTokenFromDb(uniqueField) {
      await this._removeToken(uniqueField);
    }

    /**
     * Entry point 1:
     * - Called from Wallets.js
     * - Called immediately after start of the application
     * @param  {Array<Coin>} wallets - list of coins to push generated tokens
     * @throws {InternalError}
     * @returns {Promise{Array<String>}} - List of token tickers strings
     */
    async loadTokensList(wallets) {
      try {
        this.bannedTokens = (await this.getBannedTokenList()) || [];
        const source = TOKEN_SOURCE_PREDEFINED_LIST;
        const remoteTokens = (await this.getTokenList()) || [];

        const processedTokens = this.processTokenList(
          await this.setTokensConfirmation(remoteTokens, wallets, source),
          source,
        );

        const processedUniques = processedTokens.filter((token) => token.uniqueField).map((token) => token.uniqueField);

        // clean up who was inserted by mistake
        await this.deleteDuplicates(processedTokens);

        // update metadata if changed
        await this.updateTokensInDb(processedTokens, source);

        // find who removed from the server list and delete them from db
        await this.bulkDeleteWhereNotInList((token) => {
          // select tokens from server that
          // - source is 'list' (they where saved in the db from previous server config)
          // - are not marked as isCustom (they where added by user with ui and have 'list' source set by mistake)
          // - are not in processedUniques (they where just received)
          return token.source === source && !token.isCustom && !processedUniques.includes(token.uniqueField);
        });

        const db = this.getDbTable('tokens');

        const allTokens = await db.getAll();

        const inserted =
          processedUniques.length > 0 ? allTokens.filter((token) => processedUniques.includes(token.uniqueField)) : [];

        const insertedUniques = inserted.map((token) => token.uniqueField);

        const notInserted = processedTokens.filter((token) => {
          return !insertedUniques.includes(token.uniqueField);
        });

        await this.insertTokensToDb(notInserted);

        return this.createTokens([...inserted, ...notInserted], wallets);
      } catch (error) {
        console.warn(`[HasTokensMixin] loadTokensList failed with error ${error}`);
        throw new InternalError({
          type: INTERNAL_ERROR,
          error,
          instance: this,
        });
      }
    }

    /**
     * Entry point 2:
     * - Called from Wallets.js
     * - Called after the user had successfully logged in
     * At this point we have an address available and can load user token balances
     *
     * @param {*} wallets
     * @returns {undefined}
     */
    async fetchUserTokens(wallets) {
      const dbTokens = await this.loadTokensFromDb(this.id);

      if (dbTokens && dbTokens.length === 0) {
        await this.loadTokensList(wallets);
      } else {
        this.createTokens(await this.setTokensConfirmation(dbTokens, wallets, TOKEN_SOURCE_USER), wallets);
      }

      // Fix ETHCoin con`t read prop
      const userTokens = this.getUserTokenList ? await this.getUserTokenList() : [];

      const processedTokens = await this.processTokenList(
        await this.setTokensConfirmation(userTokens, wallets, TOKEN_SOURCE_USER),
        TOKEN_SOURCE_USER,
      );

      const inserted = await this.insertTokensToDb(processedTokens);

      return this.createTokens(inserted, wallets);
    }

    /**
     * Set confirmed status for white-list
     * @param tokens
     * @returns {Promise<*>}
     */
    async setTokensConfirmation(tokens = [], wallets, source) {
      if (typeof wallets === 'undefined') {
        throw new TypeError('#setTokensConfirmation Error: wallets instance is not defined');
      }

      const confirmedTokens = await this.getTokenList();
      const confirmedTokensTickers = confirmedTokens.map((token) => token.ticker).filter(Boolean);

      const mainnetTickers = wallets
        .list()
        .filter((wallet) => !(wallet instanceof Token))
        .map((wallet) => wallet.ticker);

      return tokens.reduce((acc, next) => {
        if (source === TOKEN_SOURCE_PREDEFINED_LIST) {
          next.confirmed = true;
          return acc;
        }

        const [matchingTokenInConfirmedTokens] = confirmedTokens.filter(
          ({ contract, owner }) =>
            (contract?.toLowerCase() || owner?.toLowerCase()) ===
            (next.contract?.toLowerCase() || next.owner?.toLowerCase()),
        );

        if (matchingTokenInConfirmedTokens) {
          next.confirmed = true;
          next.isStakable = matchingTokenInConfirmedTokens.isStakable;
          return acc;
        }

        // The next for user tokens that do not match by contract with tokens specified in the config
        const noSameTickerAsInMainnet = !mainnetTickers.includes(next.ticker);
        const noSameNameAsMainnetTicker = !mainnetTickers.includes(next.name);
        const noSameTickerAsInConfirmedTokens = !confirmedTokensTickers.includes(next.ticker);
        const tickerHasAllowedCharacters = /^[a-zA-Z0-9]+$/.test(next.ticker);
        const nameHasAllowedCharacters = /^[a-zA-Z0-9 -_. ]+$/.test(next.name);
        const haveAllowedCharacters = tickerHasAllowedCharacters && nameHasAllowedCharacters;

        next.confirmed =
          noSameTickerAsInMainnet &&
          noSameTickerAsInConfirmedTokens &&
          noSameNameAsMainnetTicker &&
          haveAllowedCharacters;

        return acc;
      }, tokens);
    }

    /**
     * General processing function
     * 1. Converts server token format to internal token format
     * 2. Applies exclusion filter
     *
     * @param {Array<ServerToken>} serverTokenList - Array of token objects with
     *  external format
     *
     * @param {String} source - 'list' or 'user', defines format of a
     *  serverTokenList
     * - 'list' - list of common tokens for all users
     * - 'user' - list of specific user tokens
     *
     * @returns {Promise<tokens>}
     */
    processTokenList(serverTokenList = [], source) {
      if (!Array.isArray(serverTokenList)) {
        return [];
      }

      return serverTokenList
        .map((serverToken) => this.getTokenObject(serverToken, source))
        .filter((token) => this.isTokenExcluded(token))
        .filter((token) => !!token.ticker && !!token.name && /^[a-zA-Z0-9 -_.]+$/.test(token.ticker))
        .filter(
          (token) =>
            token.ticker.trim() !== '' &&
            !(token.ticker.length > MAX_TICKER_LENGTH || token.name.length > MAX_NAME_LENGTH),
        )
        .map((token) => ({
          ...token,
          source,
        }));
    }

    /**
     * @returns {Promise<Array>} - Unprocessed array of tokens from external
     * service
     */
    async getTokenList() {
      // should be redefined in the parent coin class
      throw new UndeclaredAbstractMethodError('getTokenList', this);
    }

    async getBannedTokenList() {
      return [];
    }

    /**
     * Used to remove particular token from the list
     * @returns {Array<Array>} - List of token tickers strings
     */
    getExcludedTokenList() {
      const banned = Array.isArray(this.bannedTokens) ? this.bannedTokens : [];

      return banned.map((token) => token.toLowerCase());
    }

    /**
     * Coin should re-implement this method to provide a list of token objects
     * in server format (list with external server token objects)
     *
     * @returns {Array<ServerToken>} - array of token objects
     */
    async getUserTokenList() {
      return [];
    }

    /**
     * If needs more complex logic for exclusion, for example spam filtering
     * should be done by re-implementing this method in parent coin
     *
     * @param {*} token - token object
     * @returns {Boolean} - true if excluded
     */
    isTokenExcluded(token) {
      return !this.getExcludedTokenList().includes(token.contract.toLowerCase());
    }

    /**
     * Convert external server token object to internal token object format
     *
     * @param {*} serverToken
     * @param {*} source
     * @returns {Token} - Token object:
     * {
     *   name: String,      // token name
     *   ticker: String,    // unique ticker of token, should be unique across all
     * coins in the coins list
     *   decimal: Number,   // number of decimals
     *   contract: String   // an address of creator of token
     *  }
     */
    getTokenObject(serverToken, source = 'user') {
      return source === 'user'
        ? this.getTokenFromUserList(serverToken, source)
        : this.getTokenFromCommonList(serverToken, source);
    }

    /**
     * Maps from user token list to internal token format
     * Maybe better name for this method is getTokenFromExplorer
     * @TODO Move the conversion to the standard shape into explorers
     * @returns {Promise<Array>}
     */
    getTokenFromUserList(token, source) {
      return {
        name: token.name,
        ticker: token.symbol,
        decimal: Number(token.decimals) || 0,
        contract: token.contractAddress?.toLowerCase(),
        parentTicker: this.id,
        uniqueField: token.contractAddress?.toLowerCase(),
        visibility: true,
        confirmed: token.confirmed,
        config: token.config,
        source,
        // The 'notify' field is for Atomic's internal use, explorers (the source of the 'user list') does not have it.
        // But we don't need to change this value, as it can be set in the native token list for this token.
        notify: token.notify,
      };
    }

    /**
     * Maps from common token list to internal token format
     * @returns {Promise<Array>}
     */
    getTokenFromCommonList(token, source) {
      return {
        name: token.name,
        ticker: token.ticker,
        decimal: Number(token.decimal) || 0,
        contract: token.contract.toLowerCase(),
        parentTicker: this.id,
        uniqueField: token.contract.toLowerCase(),
        visibility: token.visibility !== false,
        confirmed: token.confirmed,
        config: token.config,
        source: token.source || source,
        notify: Boolean(token.notify),
      };
    }

    /**
     * Updating custom token parameters, such as Name, Ticker, Decimal, Contract
     *
     * @param {*} token to update
     * @param {*} new parameters
     * @returns {Promise<tokens>} - inserted tokens
     * {
     *   name: String,      // token name
     *   ticker: String,    // unique ticker of token, should be unique across all
     * coins in the coins list
     *   decimal: Number,   // number of decimals
     *   contract: String   // an address of creator of token
     *  }
     */
    async updateCustomToken(oldToken, newParams) {
      await this.removeTokenFromDb(oldToken.uniqueField);

      for (const field in newParams) {
        if (Object.prototype.hasOwnProperty.call(newParams, field)) {
          oldToken[field] = newParams[field];
        }
      }

      const updatedToken = {
        name: oldToken.name,
        ticker: oldToken.ticker,
        decimal: Number(oldToken.decimal),
        contract: oldToken.contract.toLowerCase(),
        parentTicker: oldToken.parent,
        uniqueField: oldToken.contract.toLowerCase(),
        notify: Boolean(oldToken.notify),
      };

      const updated = await this.insertTokensToDb([updatedToken]);

      return updated;
    }

    async validateCustomToken({ name, ticker, decimal, contract }) {
      const alreadyExist = this.tokens[contract.toLowerCase()];

      if (alreadyExist) {
        throw new Error(`${this.ticker}: Contract already exists`);
      }
    }

    /**
     * Create custom token from provided params
     *
     * @param name
     * @param ticker
     * @param decimals
     * @param contract
     * @param uniqueField
     * @param visibility
     * @returns {Promise<[Token]>}
     */
    async createCustomToken({ name, ticker, decimal, contract, uniqueField, source = 'custom' }, wallets) {
      const args = { name, ticker, decimal, contract };

      await this.validateCustomToken(args);

      const tokenArgs = await this.setTokensConfirmation(
        [{ uniqueField, visibility: true, source, isCustom: true, ...args }],
        wallets,
      );

      const created = this.createTokens(tokenArgs, wallets);

      await this.insertTokensToDb(created.map((token) => this.getTokenObject(token, source)));

      return created;
    }

    /**
     * Calls for createToken of a coin and pushes the result to wallets
     * - Mutates wallets array
     * - Mutates this.tokens with created tokens
     *
     * @param {*} [tokens=[]]
     * @param {*} wallets
     * @return {any[]}
     */
    createTokens(tokens = [], wallets) {
      const tokensToCreate = tokens;
      const createdTokens = [];

      if (tokens.length === 0) {
        return;
      }

      tokensToCreate.forEach((token) => {
        const existingToken = wallets.getWallet(
          getTokenId({
            contract: token.contract,
            parent: this.id,
            ticker: token.ticker,
          }),
        );

        if (existingToken && existingToken.uniqueField === token.uniqueField) {
          // Token is already exist in `wallets` instance
          existingToken.visibility = token.visibility;

          // rewrite prop only if new token is from predefined source list
          if (token.source === TOKEN_SOURCE_PREDEFINED_LIST) {
            existingToken.notify = Boolean(token.notify);
          }

          return;
        }

        const newToken = this.createToken({
          name: token.name,
          ticker: token.ticker,
          decimal: token.decimal,
          contract: token.contract.toLowerCase(),
          uniqueField: token.uniqueField,
          visibility: token.visibility !== false,
          confirmed: token.confirmed,
          denom: token.denom,
          source: token.source,
          isStakable: token.isStakable,
          config: {
            ...(token.config || {}),
            memoRegexp: this.config.hasTokenMemo ? this.config.memoRegexp : null,
            paymentIdLabelType: this.config.hasTokenMemo ? this.config.paymentIdLabelType : null,
          },
          notify: Boolean(token.notify),
          // only for SOL tokens at moment
          mint: token.mint,
        });

        createdTokens.push(newToken);

        wallets.addWallet(newToken);
        this.tokens[token.contract.toLowerCase()] = newToken;
      });

      this.eventEmitter.emit('update::coin-list');

      return createdTokens;
    }

    async getUniquesAndDuplicates(tokens) {
      const db = this.getDbTable('tokens');
      const dbTokens = await db.getAll();

      const validPairs = new Set(
        tokens
          .filter((token) => token?.parentTicker && token?.uniqueField)
          .map((token) => `${token.parentTicker}|${token.uniqueField}`),
      );

      const collection = dbTokens.filter(({ parentTicker, uniqueField }) => {
        return validPairs.has(`${parentTicker}|${uniqueField}`);
      });

      const uniques = {};
      const duplicates = [];

      collection.forEach((token) => {
        if (!uniques[token.uniqueField]) {
          uniques[token.uniqueField] = token.id;
        } else {
          duplicates.push(token.id);
        }
      });

      return [uniques, duplicates];
    }

    async deleteDuplicates(tokens) {
      const db = this.getDbTable('tokens');

      try {
        const [, duplicates] = await this.getUniquesAndDuplicates(tokens);

        await Promise.all(
          duplicates.map((duplicate) => {
            return db.delete(duplicate);
          }),
        );
      } catch (error) {
        console.error(error);
      }
    }

    async bulkDeleteWhereNotInList(listFilter) {
      const db = this.getDbTable('tokens');

      const allTokens = await db.getAll();
      const tokensForCurrentParentTicker = allTokens.filter((token) => token.parentTicker === this.id);

      const tokensNotInProcessedList = tokensForCurrentParentTicker.filter(listFilter);

      if (tokensNotInProcessedList.length > 0) {
        await Promise.all(tokensNotInProcessedList.map((token) => db.delete(token.id)));
      }
    }
  };

export default HasTokensMixin;

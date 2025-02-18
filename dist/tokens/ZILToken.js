import { Token } from '../abstract/index.js';
class ZILToken extends Token {
    /* @TODO DEPRECATED
     * should be used `createTransaction method from Token.js
     * wich proxied to parent `createTransaction
     * */
    async createTransaction({ address, amount }) {
        return { address, amount, contract: this.contract };
    }
}
export default ZILToken;
//# sourceMappingURL=ZILToken.js.map
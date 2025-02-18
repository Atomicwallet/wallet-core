export default NeoNodeExplorer;
declare class NeoNodeExplorer extends Explorer {
    constructor(...args: any[]);
    nodeClientPromise: any;
    sendTransaction({ tx, signingConfig }: {
        tx: any;
        signingConfig: any;
    }): Promise<any>;
    getFeeInformation(api: any): Promise<any>;
    sendRawTransaction(tx: any): Promise<any>;
    getClient(): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';

export default class SuiExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    }, ...args: any[]);
    provider: JsonRpcProvider;
    getBalance(address: any, coinType: any): Promise<string>;
    getTransactions({ address, offset, limit, pageNum }: {
        address: any;
        offset: any;
        limit: any;
        pageNum: any;
    }): Promise<any>;
    modifyTransactionsResponse(response: any, address: any): any;
    getTxConfirmations(): number;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): any;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxFee(tx: any): any;
    calculateFee(tx: any): Promise<BN>;
    sign(keypair: any, tx: any): Promise<import("@mysten/sui.js").SignedTransaction>;
    send(tx: any): Promise<{
        digest: string;
        timestampMs?: string | undefined;
        transaction?: {
            data: {
                sender: string;
                messageVersion: "v1";
                transaction: {
                    epoch: string;
                    storage_charge: string;
                    computation_charge: string;
                    storage_rebate: string;
                    kind: "ChangeEpoch";
                    epoch_start_timestamp_ms?: string | undefined;
                } | {
                    epoch: string;
                    round: string;
                    commit_timestamp_ms: string;
                    kind: "ConsensusCommitPrologue";
                } | {
                    objects: string[];
                    kind: "Genesis";
                } | {
                    transactions: ({
                        MoveCall: {
                            function: string;
                            package: string;
                            module: string;
                            arguments?: ("GasCoin" | {
                                Input: number;
                            } | {
                                Result: number;
                            } | {
                                NestedResult: [number, number];
                            })[] | undefined;
                            type_arguments?: string[] | undefined;
                        };
                    } | {
                        TransferObjects: [("GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        })[], "GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        }];
                    } | {
                        SplitCoins: ["GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        }, ("GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        })[]];
                    } | {
                        MergeCoins: ["GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        }, ("GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        })[]];
                    } | {
                        Publish: string[] | [{
                            disassembled: Record<string, string>;
                        }, string[]];
                    } | {
                        Upgrade: [string[], string, "GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        }] | [{
                            disassembled: Record<string, string>;
                        }, string[], string, "GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        }];
                    } | {
                        MakeMoveVec: [string | null, ("GasCoin" | {
                            Input: number;
                        } | {
                            Result: number;
                        } | {
                            NestedResult: [number, number];
                        })[]];
                    })[];
                    inputs: ({
                        type: "pure";
                        value: import("@mysten/sui.js").SuiJsonValue;
                        valueType?: string | undefined;
                    } | {
                        type: "object";
                        objectType: "immOrOwnedObject";
                        objectId: string;
                        version: string;
                        digest: string;
                    } | {
                        type: "object";
                        objectType: "sharedObject";
                        objectId: string;
                        initialSharedVersion: string;
                        mutable: boolean;
                    })[];
                    kind: "ProgrammableTransaction";
                };
                gasData: {
                    payment: {
                        objectId: string;
                        version: string | number;
                        digest: string;
                    }[];
                    owner: string;
                    price: string;
                    budget: string;
                };
            };
            txSignatures: string[];
        } | undefined;
        effects?: {
            messageVersion: "v1";
            status: {
                status: "success" | "failure";
                error?: string | undefined;
            };
            executedEpoch: string;
            gasUsed: {
                computationCost: string;
                storageCost: string;
                storageRebate: string;
                nonRefundableStorageFee: string;
            };
            transactionDigest: string;
            gasObject: {
                owner: {
                    AddressOwner: string;
                } | {
                    ObjectOwner: string;
                } | {
                    Shared: {
                        initial_shared_version: number;
                    };
                } | "Immutable";
                reference: {
                    objectId: string;
                    version: string | number;
                    digest: string;
                };
            };
            modifiedAtVersions?: {
                objectId: string;
                sequenceNumber: string;
            }[] | undefined;
            sharedObjects?: {
                objectId: string;
                version: string | number;
                digest: string;
            }[] | undefined;
            created?: {
                owner: {
                    AddressOwner: string;
                } | {
                    ObjectOwner: string;
                } | {
                    Shared: {
                        initial_shared_version: number;
                    };
                } | "Immutable";
                reference: {
                    objectId: string;
                    version: string | number;
                    digest: string;
                };
            }[] | undefined;
            mutated?: {
                owner: {
                    AddressOwner: string;
                } | {
                    ObjectOwner: string;
                } | {
                    Shared: {
                        initial_shared_version: number;
                    };
                } | "Immutable";
                reference: {
                    objectId: string;
                    version: string | number;
                    digest: string;
                };
            }[] | undefined;
            unwrapped?: {
                owner: {
                    AddressOwner: string;
                } | {
                    ObjectOwner: string;
                } | {
                    Shared: {
                        initial_shared_version: number;
                    };
                } | "Immutable";
                reference: {
                    objectId: string;
                    version: string | number;
                    digest: string;
                };
            }[] | undefined;
            deleted?: {
                objectId: string;
                version: string | number;
                digest: string;
            }[] | undefined;
            unwrapped_then_deleted?: {
                objectId: string;
                version: string | number;
                digest: string;
            }[] | undefined;
            wrapped?: {
                objectId: string;
                version: string | number;
                digest: string;
            }[] | undefined;
            eventsDigest?: string | undefined;
            dependencies?: string[] | undefined;
        } | undefined;
        events?: {
            id: {
                txDigest: string;
                eventSeq: string;
            };
            packageId: string;
            transactionModule: string;
            sender: string;
            type: string;
            parsedJson?: Record<string, any> | undefined;
            bcs?: string | undefined;
            timestampMs?: string | undefined;
        }[] | undefined;
        checkpoint?: string | undefined;
        confirmedLocalExecution?: boolean | undefined;
        objectChanges?: ({
            packageId: string;
            type: "published";
            version: string;
            digest: string;
            modules: string[];
        } | {
            sender: string;
            type: "transferred";
            objectType: string;
            objectId: string;
            version: string;
            digest: string;
            recipient: {
                AddressOwner: string;
            } | {
                ObjectOwner: string;
            } | {
                Shared: {
                    initial_shared_version: number;
                };
            } | "Immutable";
        } | {
            sender: string;
            type: "mutated";
            objectType: string;
            objectId: string;
            version: string;
            digest: string;
            owner: {
                AddressOwner: string;
            } | {
                ObjectOwner: string;
            } | {
                Shared: {
                    initial_shared_version: number;
                };
            } | "Immutable";
            previousVersion: string;
        } | {
            sender: string;
            type: "deleted";
            objectType: string;
            objectId: string;
            version: string;
        } | {
            sender: string;
            type: "wrapped";
            objectType: string;
            objectId: string;
            version: string;
        } | {
            sender: string;
            type: "created";
            objectType: string;
            objectId: string;
            version: string;
            digest: string;
            owner: {
                AddressOwner: string;
            } | {
                ObjectOwner: string;
            } | {
                Shared: {
                    initial_shared_version: number;
                };
            } | "Immutable";
        })[] | undefined;
        balanceChanges?: {
            owner: {
                AddressOwner: string;
            } | {
                ObjectOwner: string;
            } | {
                Shared: {
                    initial_shared_version: number;
                };
            } | "Immutable";
            coinType: string;
            amount: string;
        }[] | undefined;
        errors?: string[] | undefined;
    }>;
}
import Explorer from '../../explorers/explorer.js';
import { JsonRpcProvider } from '@mysten/sui.js';
import BN from 'bn.js';

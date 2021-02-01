declare const _default: {
    blockchain: ({
        blockInfo: {
            blockNumber: number;
            blockHash: string;
            previousBlockHash: string;
            timestamp: Date;
        };
        actions: {
            type: string;
            payload: {
                todoName: string;
                id: number;
            };
        }[];
    } | {
        blockInfo: {
            blockNumber: number;
            blockHash: string;
            previousBlockHash: string;
            timestamp: Date;
        };
        actions: {
            type: string;
            payload: {
                todoId: number;
                tasks: string[];
            };
        }[];
    } | {
        blockInfo: {
            blockNumber: number;
            blockHash: string;
            previousBlockHash: string;
            timestamp: Date;
        };
        actions: {
            type: string;
            payload: {
                todoId: number;
                taskName: string;
                completed: boolean;
            };
        }[];
    })[];
    forked: ({
        blockInfo: {
            blockNumber: number;
            blockHash: string;
            previousBlockHash: string;
            timestamp: Date;
        };
        actions: {
            type: string;
            payload: {
                todoName: string;
                id: number;
            };
        }[];
    } | {
        blockInfo: {
            blockNumber: number;
            blockHash: string;
            previousBlockHash: string;
            timestamp: Date;
        };
        actions: {
            type: string;
            payload: {
                todoId: number;
                tasks: string[];
            };
        }[];
    } | {
        blockInfo: {
            blockNumber: number;
            blockHash: string;
            previousBlockHash: string;
            timestamp: Date;
        };
        actions: {
            type: string;
            payload: {
                todoId: number;
                taskName: string;
                completed: boolean;
            };
        }[];
    })[];
};
export default _default;

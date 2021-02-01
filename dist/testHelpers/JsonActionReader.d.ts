import { AbstractActionReader, Block } from 'demux';
/**
 * Reads from an array of `Block` objects, useful for testing.
 */
export declare class JsonActionReader extends AbstractActionReader {
    blockchain: Block[];
    startAtBlock: number;
    protected onlyIrreversible: boolean;
    constructor(blockchain: Block[], startAtBlock?: number, onlyIrreversible?: boolean);
    get _currentBlockNumber(): number;
    getHeadBlockNumber(): Promise<number>;
    getBlock(blockNumber: number): Promise<Block>;
    getLastIrreversibleBlockNumber(): Promise<number>;
    protected setup(): Promise<void>;
}

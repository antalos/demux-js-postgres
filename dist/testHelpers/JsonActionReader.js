"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonActionReader = void 0;
const demux_1 = require("demux");
/**
 * Reads from an array of `Block` objects, useful for testing.
 */
class JsonActionReader extends demux_1.AbstractActionReader {
    constructor(blockchain, startAtBlock = 1, onlyIrreversible = false) {
        super({ startAtBlock, onlyIrreversible });
        this.blockchain = blockchain;
        this.startAtBlock = startAtBlock;
        this.onlyIrreversible = onlyIrreversible;
    }
    get _currentBlockNumber() {
        return this.currentBlockNumber;
    }
    getHeadBlockNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            const block = this.blockchain.slice(-1)[0];
            const { blockInfo: { blockNumber } } = block;
            if (this.blockchain.length !== blockNumber) {
                throw Error(`Block at position ${this.blockchain.length} indicates position ${blockNumber} incorrectly.`);
            }
            return blockNumber;
        });
    }
    getBlock(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const block = this.blockchain[blockNumber - 1];
            if (!block) {
                throw Error(`Block at position ${blockNumber} does not exist.`);
            }
            if (block.blockInfo.blockNumber !== blockNumber) {
                throw Error(`Block at position ${blockNumber} indicates position ${block.blockInfo.blockNumber} incorrectly.`);
            }
            return block;
        });
    }
    getLastIrreversibleBlockNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.lastIrreversibleBlockNumber;
        });
    }
    setup() {
        return new Promise((resolve) => resolve());
    }
}
exports.JsonActionReader = JsonActionReader;
//# sourceMappingURL=JsonActionReader.js.map
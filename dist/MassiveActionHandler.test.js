"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dockerode_1 = __importDefault(require("dockerode"));
const massive_1 = __importDefault(require("massive"));
const path = __importStar(require("path"));
const Migration_1 = require("./Migration");
const blockchains_1 = __importDefault(require("./testHelpers/blockchains"));
const dockerUtils = __importStar(require("./testHelpers/docker"));
const JsonActionReader_1 = require("./testHelpers/JsonActionReader");
const TestMassiveActionHandler_1 = require("./testHelpers/TestMassiveActionHandler");
const updaters_1 = __importDefault(require("./testHelpers/updaters"));
const docker = new dockerode_1.default();
const postgresImageName = 'postgres:10.4';
const postgresContainerName = 'massive-action-handler-test';
const dbName = 'demuxmassivetest';
const dbUser = 'docker';
const dbPass = 'docker';
jest.setTimeout(30000);
const baseDir = path.join(path.resolve('./'), 'src');
describe('TestMassiveActionHandler', () => {
    let migrations;
    let actionReader;
    let actionHandler;
    let massiveInstance;
    let db;
    let schemaName = '';
    beforeAll((done) => __awaiter(void 0, void 0, void 0, function* () {
        yield dockerUtils.pullImage(docker, postgresImageName);
        yield dockerUtils.removePostgresContainer(docker, postgresContainerName);
        yield dockerUtils.startPostgresContainer(docker, postgresImageName, postgresContainerName, dbName, dbUser, dbPass, 6457);
        massiveInstance = yield massive_1.default({
            database: dbName,
            user: dbUser,
            password: dbPass,
            port: 6457,
        });
        done();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        schemaName = 's' + Math.random().toString(36).substring(7);
        migrations = [
            new Migration_1.Migration('createTodoTable', schemaName, path.join(baseDir, 'testHelpers/migration1.sql')),
            new Migration_1.Migration('createTaskTable', schemaName, path.join(baseDir, 'testHelpers/migration2.sql')),
        ];
        const migrationSequence = {
            migrations,
            sequenceName: 'init',
        };
        actionReader = new JsonActionReader_1.JsonActionReader(blockchains_1.default.blockchain);
        actionHandler = new TestMassiveActionHandler_1.TestMassiveActionHandler([{
                versionName: 'v1',
                updaters: updaters_1.default,
                effects: [],
            }], massiveInstance, [migrationSequence], { dbSchema: schemaName, logLevel: 'error' });
        yield actionHandler.initialize();
        yield massiveInstance.reload();
        db = massiveInstance[schemaName];
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield massiveInstance.instance.none('DROP SCHEMA $1:raw CASCADE;', [schemaName]);
    }));
    afterAll((done) => __awaiter(void 0, void 0, void 0, function* () {
        yield massiveInstance.pgp.end();
        yield dockerUtils.removePostgresContainer(docker, postgresContainerName);
        done();
    }));
    it('populates database correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const nextBlock = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock, false);
        const groceries = yield db.todo.findOne({ id: 1 });
        expect(groceries).toEqual({
            id: 1,
            name: 'Groceries',
        });
        const placesToVisit = yield db.todo.findOne({ id: 2 });
        expect(placesToVisit).toEqual({
            id: 2,
            name: 'Places to Visit',
        });
        const nextBlock2 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock2, false);
        const cookies = yield db.task.findOne({ name: 'cookies' });
        expect(cookies).toEqual({
            id: 5,
            name: 'cookies',
            completed: false,
            todo_id: 1,
        });
        const sanFrancisco = yield db.task.findOne({ name: 'San Francisco' });
        expect(sanFrancisco).toEqual({
            id: 9,
            name: 'San Francisco',
            completed: false,
            todo_id: 2,
        });
        const nextBlock3 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock3, false);
        const milk = yield db.task.findOne({ name: 'milk' });
        const dippedCookies = yield db.task.findOne({ name: 'cookies' });
        expect(milk).toEqual({
            id: 4,
            name: 'milk',
            completed: true,
            todo_id: 1,
        });
        expect(dippedCookies).toEqual({
            id: 5,
            name: 'cookies',
            completed: true,
            todo_id: 1,
        });
        const hongKong = yield db.task.findOne({ completed: true, todo_id: 2 });
        expect(hongKong).toEqual({
            id: 6,
            name: 'Hong Kong',
            completed: true,
            todo_id: 2,
        });
    }));
    it('returns a needToSeek block number if state already exists', () => __awaiter(void 0, void 0, void 0, function* () {
        const nextBlock = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock, false);
        expect(actionReader._currentBlockNumber).toBe(1);
        const nextBlock2 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock2, false);
        expect(actionReader._currentBlockNumber).not.toBe(1);
        actionHandler.reset();
        const nextBlockNeeded = yield actionHandler.handleBlock(nextBlock, false);
        expect(nextBlockNeeded).toBe(3);
    }));
    it('rolls back when blockchain forks', () => __awaiter(void 0, void 0, void 0, function* () {
        const nextBlock = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock, false);
        const nextBlock2 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock2, false);
        const nextBlock3 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock3, false);
        actionReader.blockchain = blockchains_1.default.forked;
        const forkBlock2 = yield actionReader.getNextBlock();
        expect(forkBlock2.block.blockInfo.blockNumber).toBe(2);
        expect(forkBlock2.blockMeta.isRollback).toBe(true);
        yield actionHandler.handleBlock(forkBlock2, false);
        const forkedTask = db.task.findOne({ name: 'Forked blockchain' });
        expect(forkedTask).toBeTruthy();
        const forkBlock3 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(forkBlock3, false);
        const hongKong = yield db.task.findOne({ name: 'Hong Kong' });
        expect(hongKong.completed).toBe(false);
        const forkBlock4 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(forkBlock4, false);
        const forkedTaskComplete = yield db.task.findOne({ name: 'Forked blockchain' });
        expect(forkedTaskComplete.completed).toBe(true);
    }));
    it('with Cyan Audit off if behind lastIrreversibleBlock', () => __awaiter(void 0, void 0, void 0, function* () {
        actionReader.getLastIrreversibleBlockNumber = jest.fn().mockReturnValue(2);
        const nextBlock = yield actionReader.getNextBlock();
        expect(nextBlock.lastIrreversibleBlockNumber).toEqual(2);
        yield actionHandler.handleBlock(nextBlock, false);
        const nextBlock2 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock2, false);
        let result = yield massiveInstance.query('select cyanaudit.fn_get_is_enabled();');
        expect(result[0].fn_get_is_enabled).toBe(false);
        expect(actionHandler._getCyanAuditStatus()).toEqual(false);
        const nextBlock3 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock3, false);
        result = yield massiveInstance.query('select cyanaudit.fn_get_is_enabled();');
        expect(result[0].fn_get_is_enabled).toBe(true);
        expect(actionHandler._getCyanAuditStatus()).toEqual(true);
    }));
    it('with Cyan Audit on if new block comes after lastIrreversibleBlock', () => __awaiter(void 0, void 0, void 0, function* () {
        actionReader.getLastIrreversibleBlockNumber = jest.fn().mockReturnValue(2);
        const nextBlock = yield actionReader.getNextBlock();
        expect(nextBlock.lastIrreversibleBlockNumber).toEqual(2);
        yield actionHandler.handleBlock(nextBlock, false);
        const nextBlock2 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock2, false);
        const nextBlock3 = yield actionReader.getNextBlock();
        yield actionHandler.handleBlock(nextBlock3, false);
        const result = yield massiveInstance.query('select cyanaudit.fn_get_is_enabled();');
        expect(result[0].fn_get_is_enabled).toBe(true);
        expect(actionHandler._getCyanAuditStatus()).toEqual(true);
    }));
});
//# sourceMappingURL=MassiveActionHandler.test.js.map
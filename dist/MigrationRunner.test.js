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
const Logger = __importStar(require("bunyan"));
const Migration_1 = require("./Migration");
const MigrationRunner_1 = require("./MigrationRunner");
const dockerUtils = __importStar(require("./testHelpers/docker"));
const docker = new dockerode_1.default();
const postgresImageName = 'postgres:10.4';
const dbName = 'migrationrunnertest';
const dbUser = 'docker';
const dbPass = 'docker';
const baseDir = path.join(path.resolve('./'), 'src');
const log = Logger.createLogger({ name: 'TestMigrationRunner', level: 'debug' });
class TestMigrationRunner extends MigrationRunner_1.MigrationRunner {
    _checkOrCreateSchema() {
        return __awaiter(this, void 0, void 0, function* () { yield this.checkOrCreateSchema(); });
    }
    _checkOrCreateTables() {
        return __awaiter(this, void 0, void 0, function* () { yield this.checkOrCreateTables(); });
    }
    _registerMigration(pgp, migrationName, sequenceName, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.registerMigration(pgp, migrationName, sequenceName, blockNumber);
        });
    }
    _applyMigration(pgp, migration, sequenceName, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.applyMigration(pgp, migration, sequenceName, blockNumber);
        });
    }
    _getUnappliedMigrations() {
        return __awaiter(this, void 0, void 0, function* () { return yield this.getUnappliedMigrations(); });
    }
}
jest.setTimeout(30000);
function randomSchemaName() { return 's' + Math.random().toString(36).substring(7); }
/*
 Since we need to use this functionality in the next test suites beforeAll/beforeEach,
 we test them separately here.
 */
describe('Database setup', () => {
    let massiveInstance;
    const containerName = 'database-setup-test';
    beforeAll((done) => __awaiter(void 0, void 0, void 0, function* () {
        yield dockerUtils.pullImage(docker, postgresImageName);
        yield dockerUtils.removePostgresContainer(docker, containerName);
        yield dockerUtils.startPostgresContainer(docker, postgresImageName, containerName, dbName, dbUser, dbPass, 5433);
        massiveInstance = yield massive_1.default({
            database: dbName,
            user: dbUser,
            password: dbPass,
            port: 5433,
        });
        done();
    }));
    afterAll((done) => __awaiter(void 0, void 0, void 0, function* () {
        yield massiveInstance.pgp.end();
        yield dockerUtils.removePostgresContainer(docker, containerName);
        done();
    }));
    it('creates the schema', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(massiveInstance.newSchema).toBeFalsy();
        const runner = new TestMigrationRunner(massiveInstance.instance, [], 'newschema', log);
        yield runner._checkOrCreateSchema();
        yield runner._checkOrCreateTables(); // Schema needs something inside to be seen by Massive
        yield massiveInstance.reload();
        expect(massiveInstance.newschema).toBeTruthy();
    }));
    it('creates tables and installs cyanaudit', () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new TestMigrationRunner(massiveInstance.instance, [], 'public', log);
        yield runner.setup();
        yield massiveInstance.reload();
        expect(massiveInstance._migration).toBeTruthy();
        expect(massiveInstance._index_state).toBeTruthy();
        expect(massiveInstance._block_number_txid).toBeTruthy();
        expect(massiveInstance.cyanaudit).toBeTruthy();
    }));
    it('throws when trying to migrate and not set up', () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new TestMigrationRunner(massiveInstance.instance, [], 'doesntexist', log);
        const schemaError = Error(`Schema 'doesntexist' does not exist. Make sure you have run \`setup()\` before migrating`);
        yield expect(runner.migrate('init', 1)).rejects.toEqual(schemaError);
        yield runner._checkOrCreateSchema();
        const tableError = Error(`Table '_migration' does not exist. Make sure you have run \`setup()\` before migrating`);
        yield expect(runner.migrate('init', 1)).rejects.toEqual(tableError);
    }));
});
describe('MigrationRunner', () => {
    const containerName = 'runner-test';
    let massiveInstance;
    let db;
    let pgp;
    let schemaName = '';
    let runner;
    let migrations;
    beforeAll((done) => __awaiter(void 0, void 0, void 0, function* () {
        yield dockerUtils.pullImage(docker, postgresImageName);
        yield dockerUtils.removePostgresContainer(docker, containerName);
        yield dockerUtils.startPostgresContainer(docker, postgresImageName, containerName, dbName, dbUser, dbPass, 5434);
        massiveInstance = yield massive_1.default({
            database: dbName,
            user: dbUser,
            password: dbPass,
            port: 5434,
        });
        done();
    }));
    beforeEach((done) => __awaiter(void 0, void 0, void 0, function* () {
        schemaName = randomSchemaName();
        migrations = [
            new Migration_1.Migration('createTodoTable', schemaName, path.join(baseDir, 'testHelpers/migration1.sql')),
            new Migration_1.Migration('createTaskTable', schemaName, path.join(baseDir, 'testHelpers/migration2.sql')),
            new Migration_1.Migration('createAssigneeTable', schemaName, path.join(baseDir, 'testHelpers/migration3.sql')),
        ];
        runner = new TestMigrationRunner(massiveInstance.instance, migrations, schemaName, log);
        yield runner.setup();
        yield massiveInstance.reload();
        db = massiveInstance[schemaName];
        pgp = massiveInstance.instance;
        done();
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield massiveInstance.instance.none('DROP SCHEMA $1:raw CASCADE;', [schemaName]);
    }));
    afterAll((done) => __awaiter(void 0, void 0, void 0, function* () {
        yield dockerUtils.removePostgresContainer(docker, containerName);
        done();
    }));
    it('writes row to migration table', () => __awaiter(void 0, void 0, void 0, function* () {
        yield runner._registerMigration(pgp, 'mymigration', 'init', 1);
        const row = yield db._migration.findOne({ name: 'mymigration' });
        expect(row).toHaveProperty('name');
        expect(row.name).toEqual('mymigration');
    }));
    it('gets unapplied migrations', () => __awaiter(void 0, void 0, void 0, function* () {
        const unappliedBefore = yield runner._getUnappliedMigrations();
        expect(unappliedBefore).toEqual(migrations);
        yield runner._applyMigration(pgp, migrations[0], 'init', 1);
        const unappliedMiddle = yield runner._getUnappliedMigrations();
        expect(unappliedMiddle).toEqual([migrations[1], migrations[2]]);
        yield runner._applyMigration(pgp, migrations[1], 'init', 1);
        yield runner._applyMigration(pgp, migrations[2], 'init', 1);
        const unappliedAfter = yield runner._getUnappliedMigrations();
        expect(unappliedAfter).toEqual([]);
    }));
    it('migrates all migrations', () => __awaiter(void 0, void 0, void 0, function* () {
        yield runner.migrate();
        yield massiveInstance.reload();
        expect(massiveInstance[schemaName].todo).toBeTruthy();
        expect(massiveInstance[schemaName].task).toBeTruthy();
        expect(massiveInstance[schemaName].assignee).toBeTruthy();
    }));
    it('migrates all outstanding migrations', () => __awaiter(void 0, void 0, void 0, function* () {
        yield runner._applyMigration(pgp, migrations[0], 'init', 1);
        yield massiveInstance.reload();
        expect(massiveInstance[schemaName].todo).toBeTruthy();
        expect(massiveInstance[schemaName].task).toBeFalsy();
        expect(massiveInstance[schemaName].assignee).toBeFalsy();
        yield runner.migrate();
        yield massiveInstance.reload();
        expect(massiveInstance[schemaName].todo).toBeTruthy();
        expect(massiveInstance[schemaName].task).toBeTruthy();
        expect(massiveInstance[schemaName].assignee).toBeTruthy();
    }));
    it('throws error from mismatched migration', () => __awaiter(void 0, void 0, void 0, function* () {
        yield runner._applyMigration(pgp, new Migration_1.Migration('mymigration', schemaName, path.join(baseDir, 'testHelpers/migration1.sql')), 'init', 1);
        const error = new Error('Mismatched migrations. Make sure migrations are in the same order that they have ' +
            'been previously run.');
        yield expect(runner.migrate('init', 1, pgp)).rejects.toEqual(error);
    }));
});
//# sourceMappingURL=MigrationRunner.test.js.map
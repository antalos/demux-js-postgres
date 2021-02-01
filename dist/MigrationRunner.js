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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunner = void 0;
const path = __importStar(require("path"));
const errors_1 = require("./errors");
const Migration_1 = require("./Migration");
class MigrationRunner {
    constructor(pgp, migrations, schemaName = 'public', log, skipSetup = false) {
        this.pgp = pgp;
        this.migrations = migrations;
        this.schemaName = schemaName;
        this.log = log;
        this.isSetUp = false;
        const migrationNames = migrations.map((f) => f.name);
        const nameDups = this.findDups(migrationNames);
        if (nameDups.length > 0) {
            throw new errors_1.NonUniqueMigrationNameError(nameDups);
        }
        if (skipSetup) {
            this.isSetUp = true;
        }
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Setting up Migration Runner...');
            yield this.checkOrCreateSchema();
            yield this.checkOrCreateTables();
            yield this.installCyanAudit();
            this.isSetUp = true;
            this.log.debug('Set up Migration Runner');
        });
    }
    migrate(sequenceName = 'default', blockNumber = 0, pgp = this.pgp, initial = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.throwIfNotSetup();
            const unapplied = yield this.getUnappliedMigrations(initial);
            for (const migration of unapplied) {
                yield this.applyMigration(pgp, migration, sequenceName, blockNumber);
            }
        });
    }
    applyMigration(pgp, migration, sequenceName, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const applyStart = Date.now();
            this.log.debug(`Applying migration '${migration.name}'...`);
            yield migration.up(pgp);
            yield this.refreshCyanAudit();
            yield this.registerMigration(pgp, migration.name, sequenceName, blockNumber);
            const applyTime = Date.now() - applyStart;
            this.log.info(`Applied migration '${migration.name}' (${applyTime}ms)`);
        });
    }
    // public async revertTo(migrationName) {} // Down migrations
    checkOrCreateTables() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Creating internally-needed tables if they don't already exist...`);
            const createStart = Date.now();
            yield this.pgp.none(`
      CREATE TABLE IF NOT EXISTS $1:raw._migration(
        id           serial  PRIMARY KEY,
        name         text,
        sequence     text,
        block_number integer
      );
    `, [this.schemaName]);
            yield this.pgp.none(`
      CREATE TABLE IF NOT EXISTS $1:raw._index_state (
        id                   serial  PRIMARY KEY,
        block_number         integer NOT NULL,
        block_hash           text    NOT NULL,
        is_replay            boolean NOT NULL,
        last_irreversible_block_number integer NOT NULL,
        handler_version_name text    DEFAULT 'v1'
      );
    `, [this.schemaName]);
            yield this.pgp.none(`
      CREATE TABLE IF NOT EXISTS $1:raw._block_number_txid (
        block_number integer PRIMARY KEY,
        txid         bigint  NOT NULL
      );
    `, [this.schemaName]);
            const createTime = Date.now() - createStart;
            this.log.debug(`Created internally-needed tables if they didn't already exist (${createTime}ms)`);
        });
    }
    checkOrCreateSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug(`Creating schema '${this.schemaName}' if it doesn't already exist...`);
            const createStart = Date.now();
            yield this.pgp.none(`
      CREATE SCHEMA IF NOT EXISTS $1:raw;
    `, [this.schemaName]);
            const createTime = Date.now() - createStart;
            this.log.debug(`Created schema '${this.schemaName}' if it didn't already exist (${createTime}ms)`);
        });
    }
    installCyanAudit() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Installing CyanAudit to database...');
            const installStart = Date.now();
            const cyanaudit = new Migration_1.Migration('', '', path.join(__dirname, 'cyanaudit/cyanaudit--2.2.0.sql'));
            yield cyanaudit.up(this.pgp);
            const cyanauditExt = new Migration_1.Migration('', '', path.join(__dirname, 'cyanaudit/cyanaudit-ext.sql'));
            yield cyanauditExt.up(this.pgp);
            yield this.refreshCyanAudit();
            const installTime = Date.now() - installStart;
            this.log.info(`Installed CyanAudit to database (${installTime}ms)`);
        });
    }
    refreshCyanAudit(pgp = this.pgp) {
        return __awaiter(this, void 0, void 0, function* () {
            yield pgp.many('SELECT cyanaudit.fn_update_audit_fields($1)', [this.schemaName]);
        });
    }
    registerMigration(pgp, migrationName, sequenceName, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            yield pgp.none(`
      INSERT INTO $1:raw._migration (name, sequence, block_number) VALUES ($2, $3, $4);
    `, [this.schemaName, migrationName, sequenceName, blockNumber]);
        });
    }
    getUnappliedMigrations(initial = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const migrationHistory = yield this.getMigrationHistory();
            yield this.validateMigrationHistory(migrationHistory, initial);
            return this.migrations.slice(migrationHistory.length);
        });
    }
    getMigrationHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            const migrationRows = yield this.pgp.manyOrNone(`
      SELECT name FROM $1:raw._migration;
    `, [this.schemaName]);
            return migrationRows.map((row) => row.name);
        });
    }
    validateMigrationHistory(migrationHistory, initial = false) {
        // Make sure that the migrations in this.migrations match to the migration history
        for (let i = 0; i < migrationHistory.length; i++) {
            if (i === migrationHistory.length && initial) {
                break;
            }
            else if (i === migrationHistory.length) {
                throw new errors_1.ExtraMigrationHistoryError();
            }
            if (migrationHistory[i] !== this.migrations[i].name) {
                throw new errors_1.MismatchedMigrationsHistoryError();
            }
        }
    }
    throwIfNotSetup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isSetUp) {
                yield this.checkSchema(this.schemaName);
                yield this.checkTable('_migration');
                yield this.checkTable('_index_state');
                yield this.checkTable('_block_number_txid');
                yield this.checkSchema('cyanaudit');
                this.isSetUp = true;
            }
        });
    }
    checkSchema(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            const { exists } = yield this.pgp.one(`
      SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = $1);
      `, [schema]);
            if (!exists) {
                throw new errors_1.MissingSchemaError(schema);
            }
        });
    }
    checkTable(table) {
        return __awaiter(this, void 0, void 0, function* () {
            const { exists } = yield this.pgp.one(`
      SELECT EXISTS (
        SELECT 1
        FROM   information_schema.tables
        WHERE  table_schema = $1
        AND    table_name = $2
      );
      `, [this.schemaName, table]);
            if (!exists) {
                throw new errors_1.MissingTableError(table);
            }
        });
    }
    findDups(arr) {
        return arr.reduce((acc, el, i) => {
            if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) {
                acc.push(el);
            }
            return acc;
        }, []);
    }
}
exports.MigrationRunner = MigrationRunner;
//# sourceMappingURL=MigrationRunner.js.map
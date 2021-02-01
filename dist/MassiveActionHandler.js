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
exports.MassiveActionHandler = void 0;
const demux_1 = require("demux");
const errors_1 = require("./errors");
const MigrationRunner_1 = require("./MigrationRunner");
/**
 * Connects to a Postgres database using [MassiveJS](https://github.com/dmfay/massive-js). Make sure to call
 * `setupDatabase` to create the needed internally-used tables `_migration`, `_index_state`, and `_block_number_txid`.
 * This will also automatically migrate the database with the provided MigrationSequence if named `init`.
 *
 * @param handlerVersions     See `HandlerVersion` parameter from demux-js
 *
 * @param massiveInstance     An instance of of a `massive` object provided by MassiveJS, connected to the database
 *                            you want this instance to interface with
 *
 * @param dbSchema            The name of the schema you would like to use. If it doesn't exist, it will be created when
 *                            `setupDatabase` is called.
 *
 * @param migrationSequences  An array of `MigrationSequence`s available to call via
 *                            `state.migrate(<name of sequence>)`, commonly from `Updater`'s `apply` functions that also
 *                            change the `HandlerVersion`.
 */
class MassiveActionHandler extends demux_1.AbstractActionHandler {
    constructor(handlerVersions, massiveInstance, migrationSequences = [], options) {
        super(handlerVersions, options);
        this.handlerVersions = handlerVersions;
        this.massiveInstance = massiveInstance;
        this.migrationSequences = migrationSequences;
        this.allMigrations = [];
        this.migrationSequenceByName = {};
        this.cyanauditEnabled = false;
        this.dbSchema = options.dbSchema ? options.dbSchema : 'public';
        for (const migrationSequence of migrationSequences) {
            if (this.migrationSequenceByName.hasOwnProperty(migrationSequence.sequenceName)) {
                throw new errors_1.NonUniqueMigrationSequenceError();
            }
            this.migrationSequenceByName[migrationSequence.sequenceName] = migrationSequence;
            for (const migration of migrationSequence.migrations) {
                this.allMigrations.push(migration);
            }
        }
    }
    /**
     * Migrates the database by the given sequenceName. There must be a `MigrationSequence` with this name, or this will
     * throw an error.
     *
     * @param sequenceName  The name of the MigrationSequence to be run.
     * @param pgp           pg-promise instance
     * @param initial       True if this is the first migration
     */
    migrate(sequenceName, pgp = this.massiveInstance.instance, initial = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.info(`Migrating database with Migration Sequence '${sequenceName}'...`);
            const migrateStart = Date.now();
            const migrationSequence = this.migrationSequenceByName[sequenceName];
            if (!migrationSequence) {
                throw new errors_1.NonExistentMigrationError(sequenceName);
            }
            let ranMigrations = [];
            if (!initial) {
                ranMigrations = yield this.loadAppliedMigrations();
            }
            const extendedMigrations = ranMigrations.concat(migrationSequence.migrations);
            const migrationRunner = new MigrationRunner_1.MigrationRunner(this.massiveInstance.instance, extendedMigrations, this.dbSchema, this.log, true);
            yield migrationRunner.migrate(migrationSequence.sequenceName, this.lastProcessedBlockNumber + 1, pgp, initial);
            yield this.massiveInstance.reload();
            const migrateTime = Date.now() - migrateStart;
            this.log.info(`Migrated database with Migration Sequence ${sequenceName} (${migrateTime}ms)`);
        });
    }
    /**
     * Sets up the database by idempotently creating the schema, installing CyanAudit, creates internally used tables, and
     * runs any initial migration sequences provided.
     *
     * @param initSequenceName  The name of the MigrationSequence to be used to migrate the database initially
     */
    setup(initSequenceName = 'init') {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                return;
            }
            if (!this.migrationSequenceByName[initSequenceName]) {
                if (initSequenceName === 'init') {
                    this.log.warn(`No 'init' Migration sequence was provided, nor was a different initSequenceName. ` +
                        'No initial migrations have been run.');
                }
                else {
                    throw new errors_1.NonExistentMigrationError(initSequenceName);
                }
            }
            try {
                const migrationRunner = new MigrationRunner_1.MigrationRunner(this.massiveInstance.instance, [], this.dbSchema, this.log);
                yield migrationRunner.setup();
                yield this.massiveInstance.reload();
                yield this.migrate(initSequenceName, this.massiveInstance.instance, true);
            }
            catch (err) {
                throw new demux_1.NotInitializedError('Failed to migrate the postgres database.', err);
            }
        });
    }
    get schemaInstance() {
        if (this.dbSchema === 'public') {
            return this.massiveInstance;
        }
        else {
            return this.massiveInstance[this.dbSchema];
        }
    }
    handleWithState(handle) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.lastProcessedBlockNumber < this.lastIrreversibleBlockNumber) {
                yield this.turnOffCyanAudit();
            }
            else {
                yield this.turnOnCyanAudit();
            }
            yield this.handleBlockWithTransactionId(handle);
        });
    }
    updateIndexState(state, nextBlock, isReplay, handlerVersionName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { block: { blockInfo } } = nextBlock;
            const fromDb = (yield state._index_state.findOne({ id: 1 })) || {};
            const toSave = Object.assign(Object.assign({}, fromDb), { block_number: blockInfo.blockNumber, block_hash: blockInfo.blockHash, last_irreversible_block_number: nextBlock.lastIrreversibleBlockNumber, is_replay: isReplay, handler_version_name: handlerVersionName });
            yield state._index_state.save(toSave);
            if (this.cyanauditEnabled) {
                yield state._block_number_txid.insert({
                    block_number: blockInfo.blockNumber,
                    txid: state.txid,
                });
            }
        });
    }
    loadIndexState() {
        return __awaiter(this, void 0, void 0, function* () {
            const defaultIndexState = {
                block_number: 0,
                last_irreversible_block_number: 0,
                block_hash: '',
                handler_version_name: 'v1',
                is_replay: false,
            };
            const indexState = (yield this.schemaInstance._index_state.findOne({ id: 1 })) || defaultIndexState;
            return {
                blockNumber: indexState.block_number,
                lastIrreversibleBlockNumber: indexState.last_irreversible_block_number,
                blockHash: indexState.block_hash,
                handlerVersionName: indexState.handler_version_name,
                isReplay: indexState.is_replay,
            };
        });
    }
    loadAppliedMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log.debug('Loading applied run migrations...');
            const loadStart = Date.now();
            const processedMigrationRows = yield this.massiveInstance._migration.find();
            const processedMigrations = processedMigrationRows.map((row) => {
                return {
                    name: row.name,
                    sequenceName: row.sequence,
                    blockNumber: row.block_number,
                };
            });
            const ranMigrations = [];
            for (const [index, processedMigration] of processedMigrations.entries()) {
                const expectedName = this.allMigrations[index].name;
                const actualName = processedMigration.name;
                if (expectedName !== actualName) {
                    throw new errors_1.MismatchedMigrationsError(expectedName, actualName, index);
                }
                this.log.debug(`Previously applied migration name and index matches expected: ${index} -- ${expectedName}`);
                ranMigrations.push(this.allMigrations[index]);
            }
            const loadTime = Date.now() - loadStart;
            this.log.debug(`Loaded ${ranMigrations.length} previously applied migrations (${loadTime}ms)`);
            return ranMigrations;
        });
    }
    rollbackTo(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockNumberTxIds = yield this.schemaInstance._block_number_txid.where('block_number > $1', [blockNumber], {
                order: [{
                        field: 'block_number',
                        direction: 'desc',
                    }],
            });
            for (const { block_number: rollbackNumber, txid } of blockNumberTxIds) {
                this.log.debug(`Rolling back block ${rollbackNumber} (undoing database transaction ${txid})...`);
                yield this.massiveInstance.cyanaudit.fn_undo_transaction(txid);
            }
        });
    }
    warnOverwrite(db, toOverwrite) {
        if (db.hasOwnProperty(toOverwrite)) {
            this.log.warn(`Assignment of '${toOverwrite}' on Massive object instance is overwriting property of the same ` +
                'name. Please use a different table or schema name.');
        }
    }
    turnOnCyanAudit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.cyanauditEnabled) {
                try {
                    this.log.debug('Turning on CyanAudit...');
                    const turnOnStart = Date.now();
                    yield this.massiveInstance.query('SET cyanaudit.enabled = 1;');
                    this.cyanauditEnabled = true;
                    const turnOnTime = Date.now() - turnOnStart;
                    this.log.info(`Turned on CyanAudit (${turnOnTime}ms)`);
                }
                catch (err) {
                    this.log.error(err);
                    throw new errors_1.CyanAuditError(true);
                }
            }
        });
    }
    turnOffCyanAudit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cyanauditEnabled) {
                try {
                    this.log.debug('Turning off CyanAudit...');
                    const turnOffStart = Date.now();
                    yield this.massiveInstance.query('SET cyanaudit.enabled = 0;');
                    this.cyanauditEnabled = false;
                    this.log.info('Turned off CyanAudit');
                    const turnOffTime = Date.now() - turnOffStart;
                    this.log.info(`Turned off CyanAudit (${turnOffTime}ms)`);
                }
                catch (e) {
                    this.log.error('Error: ', e);
                    throw new errors_1.CyanAuditError(false);
                }
            }
        });
    }
    handleBlockWithTransactionId(handle) {
        return this.massiveInstance.withTransaction((tx) => __awaiter(this, void 0, void 0, function* () {
            let db;
            if (this.dbSchema === 'public') {
                db = tx;
            }
            else {
                db = tx[this.dbSchema];
            }
            this.warnOverwrite(db, 'migrate');
            db.migrate = (sequenceName) => __awaiter(this, void 0, void 0, function* () { return yield this.migrate(sequenceName, tx.instance); });
            this.warnOverwrite(db, 'txid');
            db.txid = (yield tx.instance.one('select txid_current()')).txid_current;
            try {
                yield handle(db);
            }
            catch (err) {
                this.log.debug('Error thrown in updater, triggering rollback');
                throw err;
            }
        }), {
            mode: new this.massiveInstance.pgp.txMode.TransactionMode({
                tiLevel: this.massiveInstance.pgp.txMode.isolationLevel.serializable,
            }),
        });
    }
}
exports.MassiveActionHandler = MassiveActionHandler;
//# sourceMappingURL=MassiveActionHandler.js.map
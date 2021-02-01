import { Database } from 'massive';
import { IDatabase } from 'pg-promise';
import { AbstractActionHandler, HandlerVersion, IndexState, NextBlock } from 'demux';
import { MassiveActionHandlerOptions, MigrationSequence } from './interfaces';
import { Migration } from './Migration';
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
export declare class MassiveActionHandler extends AbstractActionHandler {
    protected handlerVersions: HandlerVersion[];
    protected massiveInstance: Database;
    protected migrationSequences: MigrationSequence[];
    protected allMigrations: Migration[];
    protected migrationSequenceByName: {
        [key: string]: MigrationSequence;
    };
    protected cyanauditEnabled: boolean;
    protected dbSchema: string;
    constructor(handlerVersions: HandlerVersion[], massiveInstance: Database, migrationSequences: MigrationSequence[], options: MassiveActionHandlerOptions);
    /**
     * Migrates the database by the given sequenceName. There must be a `MigrationSequence` with this name, or this will
     * throw an error.
     *
     * @param sequenceName  The name of the MigrationSequence to be run.
     * @param pgp           pg-promise instance
     * @param initial       True if this is the first migration
     */
    migrate(sequenceName: string, pgp?: IDatabase<{}>, initial?: boolean): Promise<void>;
    /**
     * Sets up the database by idempotently creating the schema, installing CyanAudit, creates internally used tables, and
     * runs any initial migration sequences provided.
     *
     * @param initSequenceName  The name of the MigrationSequence to be used to migrate the database initially
     */
    protected setup(initSequenceName?: string): Promise<void>;
    protected get schemaInstance(): any;
    protected handleWithState(handle: (state: any, context?: any) => void): Promise<void>;
    protected updateIndexState(state: any, nextBlock: NextBlock, isReplay: boolean, handlerVersionName: string): Promise<void>;
    protected loadIndexState(): Promise<IndexState>;
    protected loadAppliedMigrations(): Promise<Migration[]>;
    protected rollbackTo(blockNumber: number): Promise<void>;
    private warnOverwrite;
    private turnOnCyanAudit;
    private turnOffCyanAudit;
    private handleBlockWithTransactionId;
}

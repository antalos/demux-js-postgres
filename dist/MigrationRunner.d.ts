import * as Logger from 'bunyan';
import { IDatabase } from 'pg-promise';
import { Migration } from './Migration';
export declare class MigrationRunner {
    protected pgp: IDatabase<{}>;
    protected migrations: Migration[];
    protected schemaName: string;
    protected log: Logger;
    private isSetUp;
    constructor(pgp: IDatabase<{}>, migrations: Migration[], schemaName: string, log: Logger, skipSetup?: boolean);
    setup(): Promise<void>;
    migrate(sequenceName?: string, blockNumber?: number, pgp?: IDatabase<{}>, initial?: boolean): Promise<void>;
    protected applyMigration(pgp: IDatabase<{}>, migration: Migration, sequenceName: string, blockNumber: number): Promise<void>;
    protected checkOrCreateTables(): Promise<void>;
    protected checkOrCreateSchema(): Promise<void>;
    protected installCyanAudit(): Promise<void>;
    protected refreshCyanAudit(pgp?: IDatabase<{}>): Promise<void>;
    protected registerMigration(pgp: IDatabase<{}>, migrationName: string, sequenceName: string, blockNumber: number): Promise<void>;
    protected getUnappliedMigrations(initial?: boolean): Promise<Migration[]>;
    private getMigrationHistory;
    private validateMigrationHistory;
    private throwIfNotSetup;
    private checkSchema;
    private checkTable;
    private findDups;
}

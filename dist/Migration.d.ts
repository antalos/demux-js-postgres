import { IDatabase, QueryFile } from 'pg-promise';
export declare class Migration {
    name: string;
    protected schema: string;
    protected upSqlPath: string;
    protected downSqlPath: string | null;
    protected upQueryFile: QueryFile;
    protected downQueryFile: QueryFile | null;
    constructor(name: string, schema: string, upSqlPath: string, downSqlPath?: string | null);
    up(pgp: IDatabase<{}>): Promise<void>;
    down(pgp: IDatabase<{}>): Promise<void>;
    private loadQueryFile;
}

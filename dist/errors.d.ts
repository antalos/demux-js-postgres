export declare class NonUniqueMigrationNameError extends Error {
    constructor(nameDups: string[]);
}
export declare class NonUniqueMigrationSequenceError extends Error {
    constructor();
}
export declare class NonExistentMigrationError extends Error {
    constructor(initSequenceName: string);
}
export declare class MismatchedMigrationsError extends Error {
    constructor(expectedName: string, actualName: string, index: number);
}
export declare class MismatchedMigrationsHistoryError extends Error {
    constructor();
}
export declare class ExtraMigrationHistoryError extends Error {
    constructor();
}
export declare class MissingDownQueryError extends Error {
    constructor();
}
export declare class MissingSchemaError extends Error {
    constructor(schema: string);
}
export declare class MissingTableError extends Error {
    constructor(table: string);
}
export declare class CyanAuditError extends Error {
    constructor(cyanAuditStatus: boolean);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CyanAuditError = exports.MissingTableError = exports.MissingSchemaError = exports.MissingDownQueryError = exports.ExtraMigrationHistoryError = exports.MismatchedMigrationsHistoryError = exports.MismatchedMigrationsError = exports.NonExistentMigrationError = exports.NonUniqueMigrationSequenceError = exports.NonUniqueMigrationNameError = void 0;
// tslint:disable:max-classes-per-file
// Disabling tslint's max classes rule here because it would add a lot of unnecessary separation for simple classes.
class NonUniqueMigrationNameError extends Error {
    constructor(nameDups) {
        super(`Migrations named ${nameDups.join(', ')} are non-unique.`);
        Object.setPrototypeOf(this, NonUniqueMigrationNameError.prototype);
    }
}
exports.NonUniqueMigrationNameError = NonUniqueMigrationNameError;
class NonUniqueMigrationSequenceError extends Error {
    constructor() {
        super('Migration sequences must have unique names.');
        Object.setPrototypeOf(this, NonUniqueMigrationSequenceError.prototype);
    }
}
exports.NonUniqueMigrationSequenceError = NonUniqueMigrationSequenceError;
class NonExistentMigrationError extends Error {
    constructor(initSequenceName) {
        super(`Migration sequence '${initSequenceName}' does not exist.`);
        Object.setPrototypeOf(this, NonExistentMigrationError.prototype);
    }
}
exports.NonExistentMigrationError = NonExistentMigrationError;
class MismatchedMigrationsError extends Error {
    constructor(expectedName, actualName, index) {
        super(`Migration '${expectedName}' at index ${index} does not match ` +
            `corresponding migration in database; found '${actualName}' instead.`);
        Object.setPrototypeOf(this, MismatchedMigrationsError.prototype);
    }
}
exports.MismatchedMigrationsError = MismatchedMigrationsError;
class MismatchedMigrationsHistoryError extends Error {
    constructor() {
        super('Mismatched migrations. Make sure migrations are in the same order that they have ' +
            'been previously run.');
        Object.setPrototypeOf(this, MismatchedMigrationsHistoryError.prototype);
    }
}
exports.MismatchedMigrationsHistoryError = MismatchedMigrationsHistoryError;
class ExtraMigrationHistoryError extends Error {
    constructor() {
        super('There are more migrations applied to the database than there are present on this ' +
            'system. Make sure you have not deleted any migrations and are running up-to-date code.');
        Object.setPrototypeOf(this, MismatchedMigrationsHistoryError.prototype);
    }
}
exports.ExtraMigrationHistoryError = ExtraMigrationHistoryError;
class MissingDownQueryError extends Error {
    constructor() {
        super('This migration has no down query!');
        Object.setPrototypeOf(this, MissingDownQueryError.prototype);
    }
}
exports.MissingDownQueryError = MissingDownQueryError;
class MissingSchemaError extends Error {
    constructor(schema) {
        super(`Schema '${schema}' does not exist. Make sure you have run \`setup()\` before migrating`);
        Object.setPrototypeOf(this, MissingSchemaError.prototype);
    }
}
exports.MissingSchemaError = MissingSchemaError;
class MissingTableError extends Error {
    constructor(table) {
        super(`Table '${table}' does not exist. Make sure you have run \`setup()\` before migrating`);
        Object.setPrototypeOf(this, MissingTableError.prototype);
    }
}
exports.MissingTableError = MissingTableError;
class CyanAuditError extends Error {
    constructor(cyanAuditStatus) {
        super(`Unable to turn Cyan Audit ${cyanAuditStatus ? 'on' : 'off'}`);
        Object.setPrototypeOf(this, CyanAuditError.prototype);
    }
}
exports.CyanAuditError = CyanAuditError;
//# sourceMappingURL=errors.js.map
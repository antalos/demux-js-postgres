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
exports.Migration = void 0;
const pg_promise_1 = require("pg-promise");
const errors_1 = require("./errors");
class Migration {
    constructor(name, schema, upSqlPath, downSqlPath = null) {
        this.name = name;
        this.schema = schema;
        this.upSqlPath = upSqlPath;
        this.downSqlPath = downSqlPath;
        this.downQueryFile = null;
        this.upQueryFile = this.loadQueryFile(upSqlPath);
        if (downSqlPath) {
            this.downQueryFile = this.loadQueryFile(downSqlPath);
        }
    }
    up(pgp) {
        return __awaiter(this, void 0, void 0, function* () {
            yield pgp.none(this.upQueryFile);
        });
    }
    down(pgp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.downQueryFile) {
                throw new errors_1.MissingDownQueryError();
            }
            yield pgp.none(this.downQueryFile);
        });
    }
    loadQueryFile(filepath) {
        const options = {
            minify: true,
            noWarnings: true,
            params: {
                schema: this.schema,
            },
        };
        const qf = new pg_promise_1.QueryFile(filepath, options);
        if (qf.error) {
            throw qf.error;
        }
        return qf;
    }
}
exports.Migration = Migration;
//# sourceMappingURL=Migration.js.map
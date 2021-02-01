"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.massive = void 0;
var MassiveActionHandler_1 = require("./MassiveActionHandler");
Object.defineProperty(exports, "MassiveActionHandler", { enumerable: true, get: function () { return MassiveActionHandler_1.MassiveActionHandler; } });
var Migration_1 = require("./Migration");
Object.defineProperty(exports, "Migration", { enumerable: true, get: function () { return Migration_1.Migration; } });
var MigrationRunner_1 = require("./MigrationRunner");
Object.defineProperty(exports, "MigrationRunner", { enumerable: true, get: function () { return MigrationRunner_1.MigrationRunner; } });
const massive_1 = __importDefault(require("massive"));
exports.massive = massive_1.default;
//# sourceMappingURL=index.js.map
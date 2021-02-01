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
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const Migration_1 = require("./Migration");
class TestMigration extends Migration_1.Migration {
    get _downQueryFile() { return this.downQueryFile; }
}
const baseDir = path.join(path.resolve('./'), 'src');
describe('Migration', () => {
    it('instantiates a Migration instance', () => {
        const migration = new TestMigration('test', 'public', path.join(baseDir, 'testHelpers/migration1.sql'), path.join(baseDir, 'testHelpers/migration2.sql'));
        expect(migration).toBeTruthy();
        expect(migration._downQueryFile).not.toBe(null);
    });
});
//# sourceMappingURL=Migration.test.js.map
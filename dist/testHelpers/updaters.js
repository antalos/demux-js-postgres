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
function addTodo(db, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.todo.insert({
            id: payload.id,
            name: payload.todoName,
        });
    });
}
function addTasks(db, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const task of payload.tasks) {
            yield db.task.insert({
                todo_id: payload.todoId,
                name: task,
            });
        }
    });
}
function updateTask(db, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const task = yield db.task.findOne({ name: payload.taskName });
        yield db.task.update({ id: task.id }, { completed: payload.completed });
    });
}
exports.default = [
    {
        actionType: 'add_todo',
        apply: addTodo,
    },
    {
        actionType: 'add_tasks',
        apply: addTasks,
    },
    {
        actionType: 'update_task',
        apply: updateTask,
    },
];
//# sourceMappingURL=updaters.js.map
declare function addTodo(db: any, payload: any): Promise<void>;
declare const _default: {
    actionType: string;
    apply: typeof addTodo;
}[];
export default _default;

export default class Cache {
    static remember(key: string, callback: Function): Promise<any>;
    static has(key: string): Promise<boolean>;
    static get(key: string): Promise<any>;
    static add(key: string, value: string): Promise<boolean>;
    static put(key: string, value: string): Promise<boolean>;
    static forget(key: string): Promise<void>;
}

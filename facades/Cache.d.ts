export default class Cache {
    static remember(key: string, callback: Function, ttl?: number): Promise<any>;
    static has(key: string): Promise<boolean>;
    static get(key: string): Promise<any>;
    static add(key: string, value: string, ttl?: number): Promise<boolean>;
    static put(key: string, value: string, ttl?: number): Promise<boolean>;
    static forget(key: string): Promise<void>;
    static increment(key: string): Promise<number>;
    static decrement(key: string): Promise<number>;
}

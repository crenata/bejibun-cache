import CacheBuilder from "../builders/CacheBuilder";
export default class Cache {
    static connection(connection: string): CacheBuilder;
    static remember(key: string, callback: Function, ttl?: number): Promise<any>;
    static has(key: string): Promise<boolean>;
    static get(key: string): Promise<any>;
    static add(key: string, value: any, ttl?: number): Promise<boolean>;
    static put(key: string, value: any, ttl?: number): Promise<boolean>;
    static forget(key: string): Promise<void>;
    static increment(key: string, ttl?: number): Promise<number>;
    static decrement(key: string, ttl?: number): Promise<number>;
}

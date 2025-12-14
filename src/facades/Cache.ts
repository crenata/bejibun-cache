import CacheBuilder from "@/builders/CacheBuilder";

export default class Cache {
    public static connection(connection: string): CacheBuilder {
        return new CacheBuilder().connection(connection);
    }

    public static async remember(key: string, callback: Function, ttl?: number): Promise<any> {
        return new CacheBuilder().remember(key, callback, ttl);
    }

    public static async has(key: string): Promise<boolean> {
        return new CacheBuilder().has(key);
    }

    public static async get(key: string): Promise<any> {
        return new CacheBuilder().get(key);
    }

    public static async add(key: string, value: any, ttl?: number): Promise<boolean> {
        return new CacheBuilder().add(key, value, ttl);
    }

    public static async put(key: string, value: any, ttl?: number): Promise<boolean> {
        return new CacheBuilder().put(key, value, ttl);
    }

    public static async forget(key: string): Promise<void> {
        return new CacheBuilder().forget(key);
    }

    public static async increment(key: string, ttl?: number): Promise<number> {
        return new CacheBuilder().increment(key, ttl);
    }

    public static async decrement(key: string, ttl?: number): Promise<number> {
        return new CacheBuilder().decrement(key, ttl);
    }
}
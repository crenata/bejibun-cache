import CacheBuilder from "@/builders/CacheBuilder";

export default class Cache {
    public static async remember(key: string, callback: Function): Promise<any> {
        return new CacheBuilder().remember(key, callback);
    }

    public static async has(key: string): Promise<boolean> {
        return new CacheBuilder().has(key);
    }

    public static async get(key: string): Promise<any> {
        return new CacheBuilder().get(key);
    }

    public static async add(key: string, value: string): Promise<boolean> {
        return new CacheBuilder().add(key, value);
    }

    public static async put(key: string, value: string): Promise<boolean> {
        return new CacheBuilder().put(key, value);
    }

    public static async forget(key: string): Promise<void> {
        return new CacheBuilder().forget(key);
    }
}
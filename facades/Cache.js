import CacheBuilder from "../builders/CacheBuilder";
export default class Cache {
    static connection(connection) {
        return new CacheBuilder().connection(connection);
    }
    static async remember(key, callback, ttl) {
        return new CacheBuilder().remember(key, callback, ttl);
    }
    static async has(key) {
        return new CacheBuilder().has(key);
    }
    static async get(key) {
        return new CacheBuilder().get(key);
    }
    static async add(key, value, ttl) {
        return new CacheBuilder().add(key, value, ttl);
    }
    static async put(key, value, ttl) {
        return new CacheBuilder().put(key, value, ttl);
    }
    static async forget(key) {
        return new CacheBuilder().forget(key);
    }
    static async increment(key, ttl) {
        return new CacheBuilder().increment(key, ttl);
    }
    static async decrement(key, ttl) {
        return new CacheBuilder().decrement(key, ttl);
    }
}

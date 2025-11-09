import CacheBuilder from "../builders/CacheBuilder";
export default class Cache {
    static async remember(key, callback) {
        return new CacheBuilder().remember(key, callback);
    }
    static async has(key) {
        return new CacheBuilder().has(key);
    }
    static async get(key) {
        return new CacheBuilder().get(key);
    }
    static async add(key, value) {
        return new CacheBuilder().add(key, value);
    }
    static async put(key, value) {
        return new CacheBuilder().put(key, value);
    }
    static async forget(key) {
        return new CacheBuilder().forget(key);
    }
}

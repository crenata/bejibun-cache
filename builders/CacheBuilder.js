import App from "@bejibun/app";
import Logger from "@bejibun/logger";
import Redis from "@bejibun/redis";
import { isEmpty, isNotEmpty } from "@bejibun/utils";
import fs from "fs";
import path from "path";
import CacheConfig from "../config/cache";
import CacheException from "../exceptions/CacheException";
export default class CacheBuilder {
    conf;
    prefix;
    constructor() {
        const configPath = App.Path.configPath("cache.ts");
        let config;
        if (fs.existsSync(configPath))
            config = require(configPath).default;
        else
            config = CacheConfig;
        this.conf = config;
        this.prefix = "bejibun-cache";
    }
    get config() {
        if (isEmpty(this.conf))
            throw new CacheException("There is no config provided.");
        return this.conf;
    }
    key(key) {
        const defaultKey = `${this.prefix}-${key.replaceAll("/", "-").replaceAll(" ", "-")}`;
        return defaultKey;
        /*if (forceDefault) return defaultKey;

        switch (this.config.connection) {
            case "local":
                return `${Luxon.DateTime.now().toUnixInteger()}-${defaultKey}`;
            default:
                return defaultKey;
        }*/
    }
    connection() {
        return this.config.connections[this.config.connection];
    }
    filePath(key) {
        return path.resolve(this.connection().path, `${this.key(key)}.cache`);
    }
    file(key) {
        return Bun.file(this.filePath(key));
    }
    async setFile(key, data) {
        await fs.promises.mkdir(this.connection().path, { recursive: true });
        return await Bun.write(this.filePath(key), data);
    }
    async getFile(key) {
        const file = this.file(key);
        if (await file.exists())
            return await file.text();
        return null;
    }
    async remember(key, callback, ttl) {
        let data;
        switch (this.config.connection) {
            case "local":
                data = await this.getFile(key);
                if (isEmpty(data)) {
                    data = callback();
                    await this.setFile(key, data);
                }
                break;
            case "redis":
                data = await Redis.get(this.key(key));
                if (isEmpty(data)) {
                    data = callback();
                    await Redis.set(this.key(key), data, ttl);
                }
                break;
            default:
                data = null;
                break;
        }
        return data;
    }
    async has(key) {
        let data;
        switch (this.config.connection) {
            case "local":
                data = await this.getFile(key);
                break;
            case "redis":
                data = await Redis.get(this.key(key));
                break;
            default:
                data = false;
                break;
        }
        return isNotEmpty(data);
    }
    async get(key) {
        let data;
        switch (this.config.connection) {
            case "local":
                data = await this.getFile(key);
                break;
            case "redis":
                data = await Redis.get(this.key(key));
                break;
            default:
                data = false;
                break;
        }
        return data;
    }
    async add(key, value, ttl) {
        let status = true;
        let data;
        try {
            switch (this.config.connection) {
                case "local":
                    data = await this.getFile(key);
                    break;
                case "redis":
                    data = await Redis.get(this.key(key));
                    break;
                default:
                    data = null;
                    break;
            }
            if (isEmpty(data)) {
                switch (this.config.connection) {
                    case "local":
                        await this.setFile(key, value);
                        break;
                    case "redis":
                        await Redis.set(this.key(key), value, ttl);
                        break;
                    default:
                        break;
                }
            }
            else {
                status = false;
                Logger.setContext("Cache").info("The cache key is already exists.");
            }
        }
        catch (error) {
            status = false;
            Logger.setContext("Cache").error("Failed to add cache.").trace(error);
        }
        return status;
    }
    async put(key, value, ttl) {
        let status = true;
        try {
            switch (this.config.connection) {
                case "local":
                    await this.setFile(key, value);
                    break;
                case "redis":
                    await Redis.set(this.key(key), value, ttl);
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            status = false;
            Logger.setContext("Cache").error("Failed to add cache.").trace(error);
        }
        return status;
    }
    async forget(key) {
        switch (this.config.connection) {
            case "local":
                try {
                    await this.file(key).delete();
                }
                catch (error) {
                    break;
                }
                break;
            case "redis":
                await Redis.del(this.key(key));
                break;
            default:
                break;
        }
    }
    async increment(key, ttl) {
        let data;
        switch (this.config.connection) {
            case "local":
                data = Number(await this.getFile(key));
                if (isEmpty(data)) {
                    data = 1;
                    await this.setFile(key, String(data));
                }
                else {
                    data++;
                    await this.setFile(key, String(data));
                }
                break;
            case "redis":
                data = Number(await Redis.get(this.key(key)));
                if (isEmpty(data)) {
                    data = 1;
                    await Redis.set(this.key(key), data, ttl);
                }
                else {
                    data++;
                    await Redis.set(this.key(key), data, ttl);
                }
                break;
            default:
                data = 0;
                break;
        }
        return data;
    }
    async decrement(key, ttl) {
        let data;
        switch (this.config.connection) {
            case "local":
                data = Number(await this.getFile(key));
                if (isEmpty(data)) {
                    data = -1;
                    await this.setFile(key, String(data));
                }
                else {
                    data--;
                    await this.setFile(key, String(data));
                }
                break;
            case "redis":
                data = Number(await Redis.get(this.key(key)));
                if (isEmpty(data)) {
                    data = -1;
                    await Redis.set(this.key(key), data, ttl);
                }
                else {
                    data--;
                    await Redis.set(this.key(key), data, ttl);
                }
                break;
            default:
                data = 0;
                break;
        }
        return data;
    }
}

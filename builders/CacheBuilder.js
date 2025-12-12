import App from "@bejibun/app";
import Logger from "@bejibun/logger";
import Redis from "@bejibun/redis";
import Luxon from "@bejibun/utils/facades/Luxon";
import { defineValue, isEmpty, isNotEmpty } from "@bejibun/utils";
import fs from "fs";
import path from "path";
import CacheConfig from "../config/cache";
import CacheException from "../exceptions/CacheException";
export default class CacheBuilder {
    conf;
    prefix;
    redis;
    constructor() {
        const configPath = App.Path.configPath("cache.ts");
        let config;
        if (fs.existsSync(configPath))
            config = require(configPath).default;
        else
            config = CacheConfig;
        const redisConnection = defineValue(config.connections?.redis, {
            host: "127.0.0.1",
            port: 6379,
            password: "",
            database: 0
        });
        this.conf = config;
        this.prefix = "bejibun-cache";
        this.redis = Redis.setClient({
            host: redisConnection.host,
            port: redisConnection.port,
            password: redisConnection.password,
            database: redisConnection.database
        });
    }
    get config() {
        if (isEmpty(this.conf))
            throw new CacheException("There is no config provided.");
        return this.conf;
    }
    key(key) {
        return `${this.prefix}-${key.replaceAll("/", "-").replaceAll(" ", "-")}`;
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
    async setFile(key, data, ttl) {
        ttl = defineValue(ttl, "");
        if (isNotEmpty(ttl))
            ttl = Luxon.DateTime.now().toUnixInteger() + ttl;
        await fs.promises.mkdir(this.connection().path, { recursive: true });
        return await Bun.write(this.filePath(key), `${ttl}|${data}`);
    }
    async getFile(key) {
        let metadata = {
            ttl: null,
            data: null
        };
        const file = this.file(key);
        if (await file.exists()) {
            const raw = await file.text();
            const [unix, ...rest] = raw.split("|");
            const ttl = Number(unix);
            const data = rest.join("|");
            if (isEmpty(ttl) || Luxon.DateTime.now().toUnixInteger() <= ttl)
                metadata = {
                    ttl: defineValue(Number(ttl)),
                    data
                };
            else
                await this.file(key).delete();
        }
        return metadata;
    }
    async remember(key, callback, ttl) {
        let data;
        switch (this.config.connection) {
            case "local":
                const raw = await this.getFile(key);
                data = raw.data;
                if (isEmpty(data)) {
                    data = callback();
                    await this.setFile(key, data, ttl);
                }
                break;
            case "redis":
                data = await this.redis.get(this.key(key));
                if (isEmpty(data)) {
                    data = callback();
                    await this.redis.set(this.key(key), data, ttl);
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
                const raw = await this.getFile(key);
                data = raw.data;
                break;
            case "redis":
                data = await this.redis.get(this.key(key));
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
                const raw = await this.getFile(key);
                data = raw.data;
                break;
            case "redis":
                data = await this.redis.get(this.key(key));
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
                    const raw = await this.getFile(key);
                    data = raw.data;
                    break;
                case "redis":
                    data = await this.redis.get(this.key(key));
                    break;
                default:
                    data = null;
                    break;
            }
            if (isEmpty(data)) {
                switch (this.config.connection) {
                    case "local":
                        await this.setFile(key, value, ttl);
                        break;
                    case "redis":
                        await this.redis.set(this.key(key), value, ttl);
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
                    await this.setFile(key, value, ttl);
                    break;
                case "redis":
                    await this.redis.set(this.key(key), value, ttl);
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
                await this.redis.del(this.key(key));
                break;
            default:
                break;
        }
    }
    async increment(key, ttl) {
        let data;
        switch (this.config.connection) {
            case "local":
                const raw = await this.getFile(key);
                data = Number(raw.data);
                if (isEmpty(data)) {
                    data = 1;
                    await this.setFile(key, String(data), ttl);
                }
                else {
                    data++;
                    await this.setFile(key, String(data), ttl);
                }
                break;
            case "redis":
                data = Number(await this.redis.get(this.key(key)));
                if (isEmpty(data)) {
                    data = 1;
                    await this.redis.set(this.key(key), data, ttl);
                }
                else {
                    data++;
                    await this.redis.set(this.key(key), data, ttl);
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
                const raw = await this.getFile(key);
                data = Number(raw.data);
                if (isEmpty(data)) {
                    data = -1;
                    await this.setFile(key, String(data), ttl);
                }
                else {
                    data--;
                    await this.setFile(key, String(data), ttl);
                }
                break;
            case "redis":
                data = Number(await this.redis.get(this.key(key)));
                if (isEmpty(data)) {
                    data = -1;
                    await this.redis.set(this.key(key), data, ttl);
                }
                else {
                    data--;
                    await this.redis.set(this.key(key), data, ttl);
                }
                break;
            default:
                data = 0;
                break;
        }
        return data;
    }
}

import App from "@bejibun/app";
import Logger from "@bejibun/logger";
import Redis from "@bejibun/redis";
import Luxon from "@bejibun/utils/facades/Luxon";
import {isEmpty, isNotEmpty} from "@bejibun/utils";
import fs from "fs";
import path from "path";
import CacheConfig from "@/config/cache";
import CacheException from "@/exceptions/CacheException";

export default class CacheBuilder {
    protected conf: Record<string, any>;
    protected prefix: string;

    constructor() {
        const configPath = App.Path.configPath("cache.ts");

        let config: any;

        if (fs.existsSync(configPath)) config = require(configPath).default;
        else config = CacheConfig;

        this.conf = config;
        this.prefix = "bejibun-cache";
    }

    private get config(): Record<string, any> {
        if (isEmpty(this.conf)) throw new CacheException("There is no config provided.");

        return this.conf;
    }

    private key(key: string): string {
        const defaultKey: string = `${this.prefix}-${key.replaceAll("/", "-").replaceAll(" ", "-")}`;

        return defaultKey;
        /*if (forceDefault) return defaultKey;

        switch (this.config.connection) {
            case "local":
                return `${Luxon.DateTime.now().toUnixInteger()}-${defaultKey}`;
            default:
                return defaultKey;
        }*/
    }

    private connection(): any {
        return this.config.connections[this.config.connection];
    }

    private filePath(key: string): string {
        return path.resolve(this.connection().path, `${this.key(key)}.cache`);
    }

    private file(key: string): Bun.BunFile {
        return Bun.file(this.filePath(key));
    }

    private async setFile(key: string, data: any): Promise<number> {
        await fs.promises.mkdir(this.connection().path, {recursive: true});

        return await Bun.write(this.filePath(key), data);
    }

    private async getFile(key: string): Promise<any> {
        const file = this.file(key);

        if (await file.exists()) return await file.text();

        return null;
    }

    public async remember(key: string, callback: Function, ttl?: number): Promise<any> {
        let data: any;

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

    public async has(key: string): Promise<boolean> {
        let data: any;

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

    public async get(key: string): Promise<any> {
        let data: any;

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

    public async add(key: string, value: any, ttl?: number): Promise<boolean> {
        let status: boolean = true;
        let data: any;

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
            } else {
                status = false;
                Logger.setContext("Cache").info("The cache key is already exists.");
            }
        } catch (error: any) {
            status = false;
            Logger.setContext("Cache").error("Failed to add cache.").trace(error);
        }

        return status;
    }

    public async put(key: string, value: any, ttl?: number): Promise<boolean> {
        let status: boolean = true;

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
        } catch (error: any) {
            status = false;
            Logger.setContext("Cache").error("Failed to add cache.").trace(error);
        }

        return status;
    }

    public async forget(key: string): Promise<void> {
        switch (this.config.connection) {
            case "local":
                try {
                    await this.file(key).delete();
                } catch (error: any) {
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

    public async increment(key: string, ttl?: number): Promise<number> {
        let data: number;

        switch (this.config.connection) {
            case "local":
                data = Number(await this.getFile(key));

                if (isEmpty(data)) {
                    data = 1;
                    await this.setFile(key, String(data));
                } else {
                    data++;
                    await this.setFile(key, String(data));
                }
                break;
            case "redis":
                data = Number(await Redis.get(this.key(key)));

                if (isEmpty(data)) {
                    data = 1;
                    await Redis.set(this.key(key), data, ttl);
                } else {
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

    public async decrement(key: string, ttl?: number): Promise<number> {
        let data: number;

        switch (this.config.connection) {
            case "local":
                data = Number(await this.getFile(key));

                if (isEmpty(data)) {
                    data = -1;
                    await this.setFile(key, String(data));
                } else {
                    data--;
                    await this.setFile(key, String(data));
                }
                break;
            case "redis":
                data = Number(await Redis.get(this.key(key)));

                if (isEmpty(data)) {
                    data = -1;
                    await Redis.set(this.key(key), data, ttl);
                } else {
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
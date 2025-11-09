import App from "@bejibun/app";
import Logger from "@bejibun/logger";
import Redis from "@bejibun/redis";
import {isEmpty, isNotEmpty} from "@bejibun/utils";
import fs from "fs";
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
        return `${this.prefix}/${key}`;
    }

    public async remember(key: string, callback: Function): Promise<any> {
        let data: any;

        switch (this.config.connection) {
            case "redis":
                data = await Redis.get(this.key(key));

                if (isEmpty(data)) {
                    data = callback();
                    await Redis.set(this.key(key), data);
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
            case "redis":
                data = await Redis.get(this.key(key));
                break;
            default:
                data = false;
                break;
        }

        return data;
    }

    public async add(key: string, value: any): Promise<boolean> {
        let status: boolean = true;
        let data: any;

        try {
            switch (this.config.connection) {
                case "redis":
                    data = await Redis.get(this.key(key));
                    break;
                default:
                    data = null;
                    break;
            }

            if (isEmpty(data)) {
                switch (this.config.connection) {
                    case "redis":
                        await Redis.set(this.key(key), value);
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

    public async put(key: string, value: any): Promise<boolean> {
        let status: boolean = true;

        try {
            switch (this.config.connection) {
                case "redis":
                    await Redis.set(this.key(key), value);
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
            case "redis":
                await Redis.del(this.key(key));
                break;
            default:
                break;
        }
    }
}
import App from "@bejibun/app";
import Logger from "@bejibun/logger";
import Redis from "@bejibun/redis";
import Luxon from "@bejibun/utils/facades/Luxon";
import {defineValue, isEmpty, isNotEmpty} from "@bejibun/utils";
import Enum from "@bejibun/utils/facades/Enum";
import fs from "fs";
import path from "path";
import CacheConfig from "@/config/cache";
import CacheException from "@/exceptions/CacheException";
import CacheDriverEnum from "@/enums/CacheDriverEnum";

type CacheFile = {
    ttl: number | null,
    data: any
};

export default class CacheBuilder {
    protected conf: Record<string, any>;
    protected conn?: string;
    protected prefix: string;
    protected redis: Record<string, Function>;

    constructor() {
        const configPath = App.Path.configPath("cache.ts");

        let config: any;

        if (fs.existsSync(configPath)) config = require(configPath).default;
        else config = CacheConfig;

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

    private get config(): Record<string, any> {
        if (isEmpty(this.conf)) throw new CacheException("There is no config provided.");

        return this.conf;
    }

    private get currentConnection(): any {
        return this.config.connections[defineValue(this.conn, this.config.connection)];
    }

    private get driver(): any {
        const driver: string | null = defineValue(this.currentConnection?.driver);

        if (isEmpty(driver)) throw new CacheException(`Missing "driver" on cache config.`);

        if (!Enum.setEnums(CacheDriverEnum).hasValue(driver)) throw new CacheException(`Not supported "driver" cache.`);

        switch (driver) {
            case "local":
                if (isEmpty(this.currentConnection?.path)) throw new CacheException(`Missing "path" for "local" cache configuration.`);
                break;
            case "redis":
                if (isEmpty(this.currentConnection?.host)) throw new CacheException(`Missing "host" for "redis" cache configuration.`);
                if (isEmpty(this.currentConnection?.port)) throw new CacheException(`Missing "port" for "redis" cache configuration.`);
                break;
            default:
                break;
        }

        return driver;
    }

    private key(key: string): string {
        return `${this.prefix}-${key.replaceAll("/", "-").replaceAll(" ", "-")}`;
    }

    private filePath(key: string): string {
        return path.resolve(this.currentConnection.path, `${this.key(key)}.cache`);
    }

    private file(key: string): Bun.BunFile {
        return Bun.file(this.filePath(key));
    }

    private async setFile(key: string, data: any, ttl?: number): Promise<number> {
        ttl = defineValue(ttl, "");
        if (isNotEmpty(ttl)) ttl = Luxon.DateTime.now().toUnixInteger() + ttl;

        await fs.promises.mkdir(this.currentConnection.path, {recursive: true});

        return await Bun.write(this.filePath(key), `${ttl}|${data}`);
    }

    private async getFile(key: string): Promise<CacheFile> {
        let metadata: CacheFile = {
            ttl: null,
            data: null
        };
        const file: Bun.BunFile = this.file(key);

        if (await file.exists()) {
            const raw = await file.text();
            const [unix, ...rest] = raw.split("|");
            const ttl = Number(unix);
            const data = rest.join("|");

            if (isEmpty(ttl) || Luxon.DateTime.now().toUnixInteger() <= ttl) metadata = {
                ttl: defineValue(Number(ttl)),
                data
            };
            else await this.file(key).delete();
        }

        return metadata;
    }

    public connection(conn: string): CacheBuilder {
        this.conn = conn;

        return this;
    }

    public async remember(key: string, callback: Function, ttl?: number): Promise<any> {
        let data: any;

        switch (this.driver) {
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

    public async has(key: string): Promise<boolean> {
        let data: any;

        switch (this.driver) {
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

    public async get(key: string): Promise<any> {
        let data: any;

        switch (this.driver) {
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

    public async add(key: string, value: any, ttl?: number): Promise<boolean> {
        let status: boolean = true;
        let data: any;

        try {
            switch (this.driver) {
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
                switch (this.driver) {
                    case "local":
                        await this.setFile(key, value, ttl);
                        break;
                    case "redis":
                        await this.redis.set(this.key(key), value, ttl);
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
            switch (this.driver) {
                case "local":
                    await this.setFile(key, value, ttl);
                    break;
                case "redis":
                    await this.redis.set(this.key(key), value, ttl);
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
        switch (this.driver) {
            case "local":
                try {
                    await this.file(key).delete();
                } catch (error: any) {
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

    public async increment(key: string, ttl?: number): Promise<number> {
        let data: number;

        switch (this.driver) {
            case "local":
                const raw = await this.getFile(key);
                data = Number(raw.data);

                if (isEmpty(data)) {
                    data = 1;
                    await this.setFile(key, String(data), ttl);
                } else {
                    data++;
                    await this.setFile(key, String(data), ttl);
                }
                break;
            case "redis":
                data = Number(await this.redis.get(this.key(key)));

                if (isEmpty(data)) {
                    data = 1;
                    await this.redis.set(this.key(key), data, ttl);
                } else {
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

    public async decrement(key: string, ttl?: number): Promise<number> {
        let data: number;

        switch (this.driver) {
            case "local":
                const raw = await this.getFile(key);
                data = Number(raw.data);

                if (isEmpty(data)) {
                    data = -1;
                    await this.setFile(key, String(data), ttl);
                } else {
                    data--;
                    await this.setFile(key, String(data), ttl);
                }
                break;
            case "redis":
                data = Number(await this.redis.get(this.key(key)));

                if (isEmpty(data)) {
                    data = -1;
                    await this.redis.set(this.key(key), data, ttl);
                } else {
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
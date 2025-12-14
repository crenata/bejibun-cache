import App from "@bejibun/app";
import CacheDriverEnum from "../enums/CacheDriverEnum";
const config = {
    connection: "local",
    connections: {
        local: {
            driver: CacheDriverEnum.Local,
            path: App.Path.storagePath("cache") // absolute path
        },
        redis: {
            driver: CacheDriverEnum.Redis,
            host: "127.0.0.1",
            port: 6379,
            password: "",
            database: 0
        }
    }
};
export default config;

import App from "@bejibun/app";
const config = {
    connection: "local",
    connections: {
        local: {
            path: App.Path.storagePath("cache") // absolute path
        },
        redis: {
            host: "127.0.0.1",
            port: 6379,
            password: "",
            database: 0
        }
    }
};
export default config;

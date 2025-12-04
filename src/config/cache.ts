import App from "@bejibun/app";

const config: Record<string, any> = {
    connection: "local",

    connections: {
        local: {
            path: App.Path.storagePath("cache") // absolute path
        },

        redis: {
            host: "127.0.0.100",
            port: 6379,
            password: "",
            database: 0
        }
    }
};

export default config;
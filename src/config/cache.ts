const config: Record<string, any> = {
    connection: "redis",

    connections: {
        redis: {
            host: "127.0.0.100",
            port: 6379,
            password: "",
            database: 0
        }
    }
};

export default config;
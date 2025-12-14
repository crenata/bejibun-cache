export default class CacheBuilder {
    protected conf: Record<string, any>;
    protected conn?: string;
    protected prefix: string;
    protected redis: Record<string, Function>;
    constructor();
    private get config();
    private get currentConnection();
    private get driver();
    private key;
    private filePath;
    private file;
    private setFile;
    private getFile;
    connection(conn: string): CacheBuilder;
    remember(key: string, callback: Function, ttl?: number): Promise<any>;
    has(key: string): Promise<boolean>;
    get(key: string): Promise<any>;
    add(key: string, value: any, ttl?: number): Promise<boolean>;
    put(key: string, value: any, ttl?: number): Promise<boolean>;
    forget(key: string): Promise<void>;
    increment(key: string, ttl?: number): Promise<number>;
    decrement(key: string, ttl?: number): Promise<number>;
}

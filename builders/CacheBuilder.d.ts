export default class CacheBuilder {
    protected conf: Record<string, any>;
    protected prefix: string;
    protected redis: Record<string, Function>;
    constructor();
    private get config();
    private key;
    private connection;
    private filePath;
    private file;
    private setFile;
    private getFile;
    remember(key: string, callback: Function, ttl?: number): Promise<any>;
    has(key: string): Promise<boolean>;
    get(key: string): Promise<any>;
    add(key: string, value: any, ttl?: number): Promise<boolean>;
    put(key: string, value: any, ttl?: number): Promise<boolean>;
    forget(key: string): Promise<void>;
    increment(key: string, ttl?: number): Promise<number>;
    decrement(key: string, ttl?: number): Promise<number>;
}

export default class CacheBuilder {
    protected conf: Record<string, any>;
    protected prefix: string;
    constructor();
    private get config();
    private key;
    remember(key: string, callback: Function): Promise<any>;
    has(key: string): Promise<boolean>;
    get(key: string): Promise<any>;
    add(key: string, value: any): Promise<boolean>;
    put(key: string, value: any): Promise<boolean>;
    forget(key: string): Promise<void>;
}

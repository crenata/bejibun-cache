export default class CacheException extends Error {
    code: number;
    constructor(message?: string, code?: number);
}

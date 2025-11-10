<div align="center">

<img src="https://github.com/crenata/bejibun/blob/master/public/images/bejibun.png?raw=true" width="150" alt="Bejibun" />

![GitHub top language](https://img.shields.io/github/languages/top/crenata/bejibun-cache)
![GitHub all releases](https://img.shields.io/github/downloads/crenata/bejibun-cache/total)
![GitHub issues](https://img.shields.io/github/issues/crenata/bejibun-cache)
![GitHub](https://img.shields.io/github/license/crenata/bejibun-cache)
![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/crenata/bejibun-cache?display_name=tag&include_prereleases)

</div>

# Cache for Bejibun
Cache for Bejibun Framework.

## Usage

### Installation
Install the package.

```bash
# Using Bun
bun add @bejibun/cache

# Using Bejibun
bun ace install @bejibun/cache
```

### Configuration
The configuration file automatically executed if you are using `ace`.

Or

Add `cache.ts` inside config directory on your project if doesn't exist.

```bash
config/cache.ts
```

```ts
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
```

You can pass the value with environment variables.

### How to Use
How to use tha package.

```ts
import Cache from "@bejibun/cache";

await Cache.remember("key", () => {}); // any
await Cache.has("key"); // boolean
await Cache.get("key"); // any
await Cache.add("key", "Hello world"); // boolean
await Cache.put("key", "Lorem ipsum"); // boolean
await Cache.forget("key"); // void
```

## Contributors
- [Havea Crenata](mailto:havea.crenata@gmail.com)

## ☕ Support / Donate

If you find this project helpful and want to support it, you can donate via crypto :

| EVM                                                                                                     | Solana                                                                                                  |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| <img src="https://github.com/crenata/bejibun/blob/master/public/images/EVM.png?raw=true" width="150" /> | <img src="https://github.com/crenata/bejibun/blob/master/public/images/SOL.png?raw=true" width="150" /> |
| 0xdABe8750061410D35cE52EB2a418c8cB004788B3                                                              | GAnoyvy9p3QFyxikWDh9hA3fmSk2uiPLNWyQ579cckMn                                                            |

Or you can buy this `$BJBN (Bejibun)` tokens [here](https://pump.fun/coin/CQhbNnCGKfDaKXt8uE61i5DrBYJV7NPsCDD9vQgypump), beware of bots.

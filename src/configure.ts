import App from "@bejibun/app";
import Logger from "@bejibun/logger";
import path from "path";

const configPath: string = path.resolve(__dirname, "config");
const regex: RegExp = /\.(m?js|ts)$/;

const configs: Array<string> = Array.from(
    new Bun.Glob("**/*").scanSync({
        cwd: configPath
    })
).filter(value => (
    regex.test(value) &&
    !value.endsWith(".d.ts")
));

for (const config of configs) {
    const destination = config.replace(regex, ".ts");

    await Bun.write(App.Path.configPath(destination), await Bun.file(path.resolve(configPath, config)).text());

    Logger.setContext("CONFIGURE").info(`Copying ${config} into config/${destination}`);
}
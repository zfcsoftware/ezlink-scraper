import type { Browser } from "rebrowser-puppeteer-core";

export { };

declare global {
    var browser: Browser | null;
    namespace NodeJS {
        interface WriteStream {
            clearLine(dir: number, callback?: () => void): boolean;
            cursorTo(x: number, y?: number, callback?: () => void): boolean;
            cursorTo(x: number, callback: () => void): boolean;
        }
    }
}
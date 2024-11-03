import { BrowserManager } from './core/browser.js'
export * from './core/request.js'
export * from './core/session.js'

/**
 * New isolated Contexts will be created instead of restarting each time for less cpu consumption.
 * It is sufficient to start and maintain a single browser, as no new browser will be opened continuously. 
 * The BrowserManager Context starts a browser that can be created and keeps it open.
 */
new BrowserManager().createBrowser()





/**
 * The node-tls-client library is downloading a go module. When downloading this module, it calls process.stdout.clearLine and process.stdout.cursorTo functions.
 * Since an error was received when calling these functions with Docker, these codes were added.
 */
process.stdout.clearLine = (dir: number, callback?: () => void): boolean => {
    if (callback) callback();
    return true;
};

process.stdout.cursorTo = (x: number, y?: number | (() => void), callback?: () => void): boolean => {
    if (typeof y === 'function') {
        y();
    } else if (callback) {
        callback();
    }
    return true;
};

import { connect } from 'puppeteer-real-browser';

/**
 * BrowserManager manages a Puppeteer browser instance,
 * handles connection, disconnection, and reconnection logic.
 */
export class BrowserManager {
    private reconnectDelay: number; // Delay in milliseconds before trying to reconnect

    constructor(reconnectDelay: number = 3000) {
        this.reconnectDelay = reconnectDelay;
    }

    /**
     * Initializes the browser connection and sets the global.browser variable.
     */
    public async createBrowser(): Promise<void> {
        await this.initializeBrowser();
    }

    private async initializeBrowser(): Promise<void> {
        try {
            const { browser: newBrowser } = await connect({
                turnstile: true,
                connectOption: { defaultViewport: null }
            });

            global.browser = newBrowser;

            newBrowser.on('disconnected', () => this.handleDisconnect());
        } catch (error: unknown) {
            this.handleError(error);
        }
    }

    private handleDisconnect(): void {
        global.browser = null;
        console.warn('Browser disconnected. Attempting to reconnect...');
        this.attemptReconnect();
    }

    private handleError(error: unknown): void {
        global.browser = null;
        console.error('Error creating browser:', error);
        this.attemptReconnect();
    }

    private attemptReconnect(): void {
        setTimeout(() => this.initializeBrowser(), this.reconnectDelay);
    }
}

// Ensures that no browser remains open when the process is terminated.
process.on('exit', () => {
    if (global.browser) global.browser.close();
})

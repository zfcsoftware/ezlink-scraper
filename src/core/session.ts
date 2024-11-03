import type { Proxy, SessionResponse, WaitForSelectorOptions } from "../types/session.js";
import type { Page, BrowserContext } from "rebrowser-puppeteer-core";

/**
 * Since Puppeteer does not return the accept-language value in the request header and cannot be rendered correctly when created with navigator.languages, it is received with an in-page request.
 * Cloudflare checks the header values in the sent request and if they do not match, it is retrieved with this function.
 */
async function findAcceptLanguage(page: Page): Promise<string | null> {
    try {
        await page.setBypassCSP(true);
        return await page.evaluate(async () => {
            try {
                const response = await fetch('https://httpbin.org/get');
                const data = await response.json();
                return data.headers['Accept-Language'] || data.headers['accept-language'] || null;
            } catch {
                return null;
            }
        });
    } catch {
        return null;
    } finally {
        await page.setBypassCSP(false);
    }
}


/**
 * In the patched browser with the runtime turned off, the waitForSelector feature may not work properly intermittently. 
 * This function will prevent this and ensure consistently correct results.
 */
async function waitForSelector(page: Page, selector: string, options: WaitForSelectorOptions = { timeout: 30000 }): Promise<void> {
    const { timeout } = options;
    let isTimeout = false;
    let timer: NodeJS.Timeout;

    const timeoutPromise = new Promise<void>((_, reject) => {
        timer = setTimeout(() => {
            isTimeout = true;
            reject(new Error(`Timeout after ${timeout}ms while waiting for selector: ${selector}`));
        }, timeout) as unknown as NodeJS.Timeout;
    });

    const checkSelector = async (): Promise<void> => {
        while (!isTimeout) {
            const element = await page.$(selector).catch(() => null);
            if (element) {
                clearTimeout(timer);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    await Promise.race([checkSelector(), timeoutPromise]);
}

export async function session(proxy?: Proxy): Promise<SessionResponse> {
    let activeContext: BrowserContext | null = null;
    try {
        let session: SessionResponse = {}
        // Since all control links are in the same domain, there is no need to create separate sessions for all of them. Since a single session works in all subdomains, a fixed link was used.
        const url = 'https://cityofaurora.ezlinksgolf.com/'
        let waitRepeat = 0;

        while (!global.browser && waitRepeat < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            waitRepeat++;
        }
        if (!global.browser) return { error: 'A context could not be started because the scanner could not be created.' }

        const proxyConfig = proxy ? { proxyServer: `http://${proxy.host}:${proxy.port}` } : {};
        const context = await global.browser.createBrowserContext(proxyConfig)
        activeContext = context

        const page = await context.newPage()

        if (proxy?.username && proxy?.password) {
            await page.authenticate({
                username: proxy.username,
                password: proxy.password
            })
        }

        const acceptLanguageHeader = await findAcceptLanguage(page);
        if (!acceptLanguageHeader) return { error: 'The accept-language header could not be retrieved.' }

        page.on('response', async (res) => {
            try {
                if ([200, 302].includes(res.status()) && [url, url + '/'].includes(res.url())) {
                    await page.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => { });
                    const cookies = await page.cookies()
                    let headers = await res.request().headers()
                    delete headers['content-type']
                    delete headers['accept-encoding']
                    delete headers['accept']
                    delete headers['content-length']
                    delete headers['cookie']
                    headers["accept-language"] = acceptLanguageHeader
                    session = { cookies, headers }
                }
            } catch (e) { }
        })

        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await waitForSelector(page, '#pickerDate')

        if (session.cookies === undefined || session.headers === undefined) return { error: 'The cookies and headers could not be retrieved.' }

        return session
    } catch (error: unknown) {
        return { error }
    } finally {
        if (activeContext) await activeContext.close();
    }
}

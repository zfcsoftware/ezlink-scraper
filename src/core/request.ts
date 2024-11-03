import type { RequestOption, ResponseBody } from "../types/session.js";
/**
 * Local request libraries were not used because TLS Fingerprint was checked. The node-tls-client library was used because Cycletls has problems sending bulk requests. 
 * Both libraries are node.js framed versions of Golang libraries. Since there are not many solutions that can be used with node.js, the most stable library node-tls-client was preferred.
 */
import { Session, ClientIdentifier } from 'node-tls-client';

// Starting a TLS session. Single session is used to avoid constantly starting new sessions
const tlsSession = new Session({
    clientIdentifier: ClientIdentifier.chrome_124,
    timeout: 8000,
});

/**
 * Function to bypass TLS Fingerprint check and use existing session with Node.js
 */
export async function sendRequest(config: RequestOption): Promise<ResponseBody> {
    try {
        const { url, body, session, proxy } = config;

        const proxyUrl = proxy
            ? `http://${proxy.username ? `${proxy.username}:${proxy.password}@` : ""}${proxy.host}:${proxy.port}`
            : undefined;

        const headers = {
            ...session.headers,
            "Content-Type": "application/json",
            cookie: [
                ...session.cookies?.map(item => `${item.name}=${item.value}`) ?? [],
                `EZBookPro.SessionId=${Math.random()}` // EZBookPro.SessionId cookie value is checked and blocked by Cloudflare. It is accepted when posted with any value.
            ].join('; ')
        };

        const response = await tlsSession.post(url, {
            proxy: proxyUrl,
            redirect: true,
            headers,
            body: JSON.stringify(body)
        });

        if (response.status !== 200) return { error: `${response.status} - Session is no longer valid.` };

        const responseBody: ResponseBody = await response.json();

        if (Object.keys(responseBody).length <= 5 || (responseBody?.r05?.length || 0) <= 0) return { error: 'Response body is not in the correct format.' };

        return responseBody;
    } catch (error: unknown) {
        return { error }
    }
}
import type { TestConfigs } from '../src/types/tests.js'
import type { SessionResponse, ResponseBody } from '../src/types/session.js'


import { session, sendRequest } from '../src/index.js'
import fs from 'fs'

const testConfigs: TestConfigs[] = JSON.parse(fs.readFileSync('./tests/testConfigs.json', 'utf8'))

describe('Session Management Tests', () => {

    test('Single Request Test', async () => {
        const singleSession: SessionResponse = await session()

        expect(singleSession.error).toBeUndefined()

        for (const item of testConfigs) {
            const singleRequest: ResponseBody = await sendRequest({
                url: item.url,
                body: item.body,
                session: singleSession
            })
            expect(singleRequest.error).toBeUndefined()
        }

    }, 30000);

    /**
     * The site terminates the session by giving a 429 error when repeated requests are sent from the same ip address with the same session.
     * This problem does not occur when requests are sent using the same ip address and different sessions.
     * This test creates 10 sessions over the same ip address and sends 5 threads 100 requests. 
     * The same ip was used to avoid complicating the project. It would be more useful to create a session pool with ipv4 addresses in a developed product.
     */
    test('5 Thread 100 Request Test', async () => {
        let sessions: SessionResponse[] = []
        let [rotateIndex, successCount, thread] = [0, 0, 0];

        console.log(
            "Using the same ip address, 10 sessions are created in sequence. This may take a while.\n" +
            "Since proxy is not used, only one thread is running. Dozens of sessions can be created at the same time using proxy. Please wait..."
        );

        for (let i = 0; i < 10; i++) {
            let singleSession: SessionResponse = await session()
            if (singleSession.error === undefined) sessions.push(singleSession)
        }

        expect(sessions.length >= 7).toBeTruthy();

        console.log(`${sessions.length} sessions were successfully created from 10 session creation requests.`);

        function rotate(arr: SessionResponse[]): SessionResponse {
            if (!arr[rotateIndex]) rotateIndex = 0
            return arr[rotateIndex++]
        }

        function getRandomInt(min: number, max: number): number {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        for (let i = 0; i < 100; i++) {
            let configItem: TestConfigs = testConfigs[getRandomInt(0, testConfigs.length - 1)];
            thread++
            sendRequest({
                url: configItem.url,
                body: configItem.body,
                session: rotate(sessions)
            })
                .then((response: ResponseBody) => {
                    if (response.error === undefined) successCount++;
                    else console.log(response.error);
                })
                .catch((err: unknown) => {
                    console.log(err);
                })
                .finally(() => { thread-- })

            while (thread > 5) { await new Promise(resolve => setTimeout(resolve, 500)); }
        }

        while (thread !== 0) { await new Promise(resolve => setTimeout(resolve, 500)); }

        console.log(`${successCount} out of 100 requests were successfully completed`);

        expect(successCount >= 90).toBeTruthy();

    }, 120000)

})
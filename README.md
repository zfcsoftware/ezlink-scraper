# Ezlink Scraper
This repo provides a solution for multi thread scraping the ezlinksgolf[.]com website.

## Task
Send more than 30 requests in multi thread total to any subdomain of ezlinksgolf[.]com website (5 threads and 100 requests selected).

## Approach
- Checked with the help of check-host.net to see if there is a country without Cloudflare WAF. Only USA - Atlanta was successful, but only check-host may have been allowed. Scraping failed with different user-agent values with proxy in the same location.
- Since there was no shortcut solution, a Cloudflare session was created and a scraping method was created. Since a proxy is not required to pass a test consisting of 5 threads and 100 requests, 10 sessions were created from the same ip address and each session was used in turn. The reason for creating 10 sessions is that a single session gives 429 error after a few requests.
- Since no proxy was used, sessions were created sequentially. For a project in production environment, I would set up a session pool consisting of static ipv4 addresses. I would constantly increase the number of sessions in the pool according to the request size. When the number of requests increases, I would immediately increase the number of sessions.

## Test Content
- Session Management Tests > Single Request Test | It creates a single session and sends requests to 2 different subdomains.
- Session Management Tests > 5 Thread 100 Request Test | 10 sessions are created and 5 threads send 100 requests. Each request is randomly selected from 2 different domains.

## Running the Test

```bash
git clone https://github.com/zfcsoftware/ezlink-scraper
cd ezlink-scraper
npm i
```

Use with Node.js

```bash
npm test
```

Use with bun

```bash
bun test
```

Use with Docker

```bash
docker build -t ezlink-scraper .
docker run ezlink-scraper
```

## Test Video

[![Ezlink Scraper Test](https://img.youtube.com/vi/VpHdJOdgLJA/0.jpg)](https://www.youtube.com/watch?v=VpHdJOdgLJA)# ezlink-scraper

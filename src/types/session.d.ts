import type { Cookie } from "rebrowser-puppeteer-core";

export interface Proxy {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export interface SessionResponse {
    error?: unknown;
    cookies?: Cookie[];
    headers?: Record<string, string>;
}

export interface WaitForSelectorOptions {
    timeout: number;
}

interface RequestBody {
    p01: number[];
    p02: string;
    p03: string;
    p04: string;
    p05: number;
    p06: number;
    p07: boolean;
}

export interface RequestOption {
    body: RequestBody;
    url: string;
    session: SessionResponse;
    proxy?: Proxy;
}

interface ItemDetails {
    r01: number;
    r02: number;
    r03: string;
    r04: string | null;
}

export interface ResponseBody {
    r01?: string;
    r02?: string;
    r03?: string;
    r04?: string;
    r05?: ItemDetails[];
    r06?: object[];
    error?: unknown;
}


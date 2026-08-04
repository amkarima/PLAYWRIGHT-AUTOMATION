import { request, APIRequestContext } from 'playwright';
import * as fs from 'fs';

/* =======================
        TYPES
======================= */

type ApiPostOptions<T = unknown> = {
    headers: Record<string, string>;
    data?: string;
    form?: Record<string, string>;
    useProxy?: boolean;
};

type TokenResponse = {
    access_token: string;
};

type SimulationResponse = {
    id: string;
};

type UrlResponse = {
    link: string;
};

/* =======================
        CONFIG
======================= */

const withProxy = {
    server: "VIP2-PROXY.CACF.GCA:8080"
};

/* =======================
        CORE HTTP
======================= */

async function createContext(useProxy = true): Promise<APIRequestContext> {
    return request.newContext({
        ignoreHTTPSErrors: true,
        timeout: 20000,
        ...(useProxy && { proxy: withProxy })
    });
}

async function apiPost<T>(url: string, options: ApiPostOptions): Promise<T> {
    const context = await createContext(options.useProxy);

    try {
        const response = await context.post(url, {
            headers: options.headers,
            data: options.data,
            form: options.form
        });

        if (!response.ok()) {
            const text = await response.text();
            console.error(text);
            throw new Error(`HTTP ${response.status()} - ${url}`);
        }

        return await response.json() as T;

    } finally {
        await context.dispose();
    }
}

/* =======================
        HELPERS
======================= */

function readFile(file: string): string {
    return fs.readFileSync(`datas/ceasy/${file}`, 'utf-8');
}

function readFileWithReplace(
    file: string,
    replacements: Record<string, string>
): string {
    let content = readFile(file);

    for (const [key, value] of Object.entries(replacements)) {
        content = content.replaceAll(`{{${key}}}`, value);
    }

    return content;
}

/* =======================
        TOKEN
======================= */

export async function getToken(auth: string): Promise<string> {
    const res = await apiPost<TokenResponse>(
        'https://rct-api.sofinco.fr/token',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: auth
            },
            form: {
                grant_type: 'client_credentials'
            }
        }
    );

    return res.access_token;
}

/* =======================
        SIMULATION
======================= */

type SimulationParams = {
    url: string;
    file: string;
    token: string;
    appId?: string;
    useProxy?: boolean;
};

export async function getSimulation({
    url,
    file,
    token,
    appId = 'creditPartner',
    useProxy = true
}: SimulationParams): Promise<string> {

    const res = await apiPost<SimulationResponse>(url, {
        headers: {
            'Content-Type': 'application/json',
            'Context-Applicationid': appId,
            Authorization: `Bearer ${token}`
        },
        data: readFile(file),
        useProxy
    });

    return res.id;
}

/* =======================
    URL GENERATION
======================= */

type UrlParams = {
    token: string;
    simulationId: string;
    file: string;
    partenaire: string;
    contrat: string;
    appId: string;
    t2: boolean;
};

export async function getUrl({
    token,
    simulationId,
    file,
    partenaire,
    contrat,
    appId,
    t2=false
}: UrlParams): Promise<string> {
    let payload = await fs.readFileSync("datas/ceasy/" + file, 'utf-8').replace("{{simulationId}}",simulationId).replaceAll("{{orderId}}", "testauto" + Math.floor(Math.random() * 30000))
    if(t2){
      const t2Datas = fs.readFileSync("datas/ceasy/coborrower.json", 'utf-8')
      payload = payload.replaceAll("{{t2}}", t2Datas)
    }
    else{
        payload = payload.replaceAll("{{t2}}", "{}")
    }
    const res = await apiPost<UrlResponse>(
        'https://rct-api.sofinco.fr/partnerDataExchange/v1/links/',
        {
            headers: {
                'Content-Type': 'application/json',
                'Context-Applicationid': appId,
                'Context-Partnerid': partenaire,
                'Context-Sourceid': contrat,
                Authorization: `Bearer ${token}`
            },
            data: payload
        }
    );

    return res.link;
}

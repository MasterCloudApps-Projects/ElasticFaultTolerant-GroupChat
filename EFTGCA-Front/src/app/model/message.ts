export interface Error {
    code: string;
    message: string;
}

export interface Message {
    jsonrpc: string;
    method?: string;
    error?: Error;
    result?:string;
    params?: any;
    id?: number;
}
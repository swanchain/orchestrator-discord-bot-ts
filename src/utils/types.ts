export interface DiscordRequestOptions {
    method: string;
    body?: any;

    [key: string]: any;
}

export interface Command {
    name: string;
    description: string;
    options?: any[];
}

export interface CommandData {
    name: string;
    description: string;
    type: number;
    options: any[];
}

export interface GetConfig {
    key: string;
    value: string;
    is_active: boolean;
    mode: string;
}

export interface user {
    discord_id: string;
    from_wallet_address: string;
    to_wallet_address: string;
    last_claim_time: string;
    claimed_amount: string;
    transaction_hash: string;
    token_symbol: string;
}
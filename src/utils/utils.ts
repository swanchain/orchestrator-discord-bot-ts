import 'dotenv/config';
import fetch from 'node-fetch';
import {verifyKey} from 'discord-interactions';
import {Command, DiscordRequestOptions} from "./types";

export function VerifyDiscordRequest(clientKey: string) {
    return function (req: any, res: any, buf: Buffer, encoding: string) {
        const signature = req.get('X-Signature-Ed25519');
        const timestamp = req.get('X-Signature-Timestamp');

        console.log('signature', signature);
        const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
        console.log('isValidRequest', isValidRequest);
        if (!isValidRequest) {
            res.status(401).send('Bad request signature');
            console.log('Bad request signature');
            throw new Error('Bad request signature');
        }
    };
}

export async function DiscordRequest(endpoint: string, options: DiscordRequestOptions) {
    const url = 'https://discord.com/api/v10/' + endpoint;
    if (options.body) options.body = JSON.stringify(options.body);

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
        },
        ...options
    });

    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    return res;
}


export async function InstallGlobalCommands(appId: string, commands: Command[]) {
    const endpoint = `applications/${appId}/commands`;
    try {
        await DiscordRequest(endpoint, {method: 'PUT', body: commands});
    } catch (err) {
        console.error(err);
    }
}

export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

export function getEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
}

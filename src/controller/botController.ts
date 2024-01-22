import { Client, Message, Guild } from 'discord.js';
import { UserService } from '../commandHandler/handleFaucetCommand'; 
import { getConfig } from '../model/config';
import { infoLogger, errorLogger } from '../log/logger';
import { Web3 } from 'web3';
import { Semaphore } from 'async-mutex';

export class BotController {
    private client: Client;
    private userService: UserService;
    private semaphore: any;     

    constructor(client: Client, userService: UserService) {
        this.client = client;
        this.userService = userService;
        this.semaphore = null;
    }

    static async create(client: Client, userService: UserService): Promise<BotController> {
        const instance = new BotController(client, userService);
        await instance.registerEvents();
        return instance;
    }
    async registerEvents(): Promise<void> {
        const maxRequest = parseInt(await getConfig('MAX_REQUEST') || '0');
        this.semaphore = new Semaphore(maxRequest);
    
        this.client.on('ready', async () => {
            try {
                const botGuild = await getConfig('BOT_GUILD');
                const guild = this.client.guilds.cache.find(g => g.name === botGuild);
                if (!guild) {
                    infoLogger.info(`-- ${this.client.user?.username} is not connected to any guilds.`);
                    return;
                }
                if (guild instanceof Guild) {
                    infoLogger.info(`-- Logged on as ${this.client.user?.username}! \n` +
                                    `-- ${this.client.user?.username} is connected to the following guild: \n` +
                                    `-- ${guild.name} (id: ${guild.id}) \n`);
                } else {
                    infoLogger.info(`-- ${this.client.user?.username} is not connected to any guilds.`);
                    return;
                }
            } catch (e) {
                errorLogger.error(`Failed to get guild: ${e}`);
                return;
            }
        });
    
        this.client.on('message', async (message: Message) => {
            const command = message.content.split(' ')[0]; 
        
            if (command === 'lag_faucet') {
                const channelId = await getConfig('LAG_CHANNEL_ID');
                if (channelId !== null) {
                    await this.processClaimRequest(message, 'POLYGON', 'LAG', 'LAG', false, channelId);
                } else {
                    infoLogger.info(`-- LAG_CHANNEL_ID is null.`);
                }
            } else if (command === 'pusdc_faucet') {
                const channelId = await getConfig('POLYGON_USDC_CHANNEL_ID');
                await this.processClaimRequest(message, 'POLYGON', 'POLYGON_USDC', 'POLYGON_TEST_USDC', false, channelId);
            } else if (command === 'swan_usdc_faucet') {
                const channelId = await getConfig('SWAN_TEST_CHANNEL_ID');
                await this.processClaimRequest(message, 'OPSWAN', 'OPSWAN', 'OPSWAN_TEST_USDC', true, channelId);
            } else if (command === 'help') {
                const helpMessage = `
                    lag_faucet: Claim LAG Token from the faucet
                    pusdc_faucet: Claim Polygon USDC tokens from the faucet
                    swan_usdc_faucet: Claim Swan USDC from the faucet
                `;
                message.channel.send(helpMessage);
            }
        });
    }

    async processClaimRequest(ctx: any, network: string, tokenName: string, tokenSymbol: string, isTest = false, channelId?: string): Promise<void> {
        const release = await this.semaphore.acquire();

        try {
            // ...
        } finally {
            release();
        }
    }
}




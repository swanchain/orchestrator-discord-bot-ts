import { Client, Message, Guild } from 'discord.js';
import { UserService } from '../commandHandler/handleFaucetCommand'; 
import { getConfig } from '../model/config';
import { infoLogger, errorLogger } from '../log/logger';
import { isAddress } from 'web3-validator'
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
                if (channelId !== null) {
                    await this.processClaimRequest(message, 'POLYGON', 'POLYGON_USDC', 'POLYGON_TEST_USDC', false, channelId);
                } else {
                    infoLogger.info(`-- POLYGON_USDC_CHANNEL_ID is null.`);
                }
            } else if (command === 'swan_usdc_faucet') {
                const channelId = await getConfig('SWAN_TEST_CHANNEL_ID');
                if (channelId !== null) {
                    await this.processClaimRequest(message, 'OPSWAN', 'OPSWAN', 'OPSWAN_TEST_USDC', true, channelId);
                } else {
                    infoLogger.info(`-- SWAN_TEST_CHANNEL_ID is null.`);
                }
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
            if (!channelId) {
                errorLogger.error("Channel id is not set");
                ctx.reply('Source error, please contact admin.');
                return;
            }
            if (ctx.channel.id !== parseInt(channelId)) {
                errorLogger.error(`Received invalid channel id: ${ctx.channel.id}`);
                ctx.reply(
                    'Invalid channel id, if you are trying to get the swan-test-usdc, please use usdc-faucet channel, ' +
                    'if you are trying to get the lag token, please use lag-faucet channel. '
                );
                return;
            }
            const toWalletAddress = ctx.message.content.split().pop();
            if (!toWalletAddress || !isAddress(toWalletAddress)) {
                ctx.reply('Invalid wallet address, please try again.');
                errorLogger.error(`Invalid wallet address: ${toWalletAddress}`);
                return;
            }
            if (toWalletAddress === toWalletAddress.toLowerCase() || toWalletAddress === toWalletAddress.toUpperCase()) {
                ctx.reply('We do not support wallet addresses that are all in lowercase or uppercase.');
                errorLogger.error(`Unsupported wallet address format: ${toWalletAddress}`);
                return;
            }
            ctx.reply('Your claim is being processed. Please wait...');
            const fromWalletAddress = await getConfig('FROM_WALLET_ADDRESS');
            const claimedAmount = await getConfig('CLAIMED_AMOUNT');
            infoLogger.info(`-- ${ctx.author.username} is claiming ${claimedAmount} ${tokenSymbol} to ${toWalletAddress}`);
            const txHash = await this.userService.transferAndRecord(ctx.author.id, ctx.author.username, network, tokenName,
                                                                    fromWalletAddress || '', toWalletAddress || '',
                                                                    claimedAmount || '', tokenSymbol, isTest);
            if (!txHash) {
                ctx.reply(
                    `Failed to claim ${claimedAmount} ${tokenSymbol} to ${toWalletAddress || ''}, please try again later.`
                );
            } else {
                ctx.reply(
                    `Claimed ${claimedAmount} ${tokenSymbol} to ${toWalletAddress || ''}, your tx_hash is: ${txHash}, ` +
                    `you will receive it shortly.`
                );
            }
        } finally {
            release();
        }
    }


}

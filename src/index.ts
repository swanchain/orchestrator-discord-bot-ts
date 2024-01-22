import { Client, GatewayIntentBits } from 'discord.js';
import { AppDataSource } from '../data-source'; 
import { BotController } from './controller/botController';
import { UserService } from './commandHandler/handleFaucetCommand'
import express from 'express';
import { interactionsHandler } from './interactionsHandler';
import {getEnvVar, InstallGlobalCommands, VerifyDiscordRequest} from "./utils/utils";
import {ALL_COMMANDS} from "./commands";
import "reflect-metadata";



const client = new Client({ 
    intents: [  
        GatewayIntentBits.Guilds,  
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});
const botToken = getEnvVar('DISCORD_BOT_TOKEN');

if (!botToken) {
    console.error('Bot token is not set or invalid');
    process.exit(1);
}

const userService = new UserService();
BotController.create(client, userService);

client.login(botToken)
    .then(() => console.log('Bot connected successfully.'))
    .catch(e => {
        console.error(`Bot connection failed: ${e}`);
        process.exit(1);
    });

const app = express();
const PORT = process.env.PORT || 3000;
const publicKey = getEnvVar('PUBLIC_KEY')
const APP_ID = getEnvVar('APP_ID');

app.use(express.json(
    {
        verify: VerifyDiscordRequest(publicKey)
    }
));
app.post('/interactions', interactionsHandler);

async function startServer() {
    console.log('Starting server...');
    try {
        console.log('Initializing data source...');
        await AppDataSource.initialize();
        console.log('Data source has been initialized');

        const userService = new UserService();
        const botController = BotController.create(client, userService);

        console.log('Installing global commands');
        await InstallGlobalCommands(APP_ID, ALL_COMMANDS);
        console.log('Global commands installed successfully.');

        console.log('Starting Discord bot...');
        const botToken = getEnvVar('DISCORD_BOT_TOKEN');
        await client.login(botToken);
        console.log('Discord bot started successfully.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();

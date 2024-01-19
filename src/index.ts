import express from 'express';
import { interactionsHandler } from './interactionsHandler';
import {getEnvVar, InstallGlobalCommands, VerifyDiscordRequest} from "./utils/utils";
import {ALL_COMMANDS} from "./commands";

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
// Install global commands when the server starts
async function startServer() {
    console.log('Starting server...');
    try {
        console.log('Installing global commands');
        await InstallGlobalCommands(APP_ID, ALL_COMMANDS);
        console.log('Global commands installed successfully.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to install global commands:', error);
    }
}
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
startServer();

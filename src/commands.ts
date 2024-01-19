import 'dotenv/config';
import {CommandData} from "./utils/types";

const FIND_RESTAURANT_COMMAND: CommandData = {
    name: 'get_swan',
    description: 'Faucet for swan',
    type: 1, // Type 1 is a "CHAT_INPUT" command in Discord's API
    options: [
        {
            type: 3, // Type 3 means a string
            name: 'address',
            description: 'You can enter your address to get swan',
            required: true,
        },
    ],
};


export const ALL_COMMANDS = [FIND_RESTAURANT_COMMAND];
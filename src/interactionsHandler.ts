import { Request, Response } from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';
import {handleFaucetCommand} from "./commandHandler/handleFaucetCommand";

export const interactionsHandler = async (req: Request, res: Response) => {
    const { type, data } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }


    if (type === InteractionType.APPLICATION_COMMAND && data.name === 'get_swan') {
        const userId = req.body.member.user.id;
        const address = data.options.find((opt: { name: string; }) => opt.name === 'address')!.value;  // 获取地址
        try {
            const content = await handleFaucetCommand(address, userId);
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content },
            });
        } catch (error) {
            console.error('Error handling get_swan command:', error);
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content: `<@${userId}> \n An error occurred while sending swan.` },
            });
        }
    }

    // Handle other interaction types if necessary
};
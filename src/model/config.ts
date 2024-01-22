import {Entity, PrimaryGeneratedColumn, Column, getRepository} from "typeorm";
import { errorLogger } from '../log/logger';
import { AppDataSource } from "../../data-source";
import * as dotenv from 'dotenv';

dotenv.config();
const botConfig = process.env.BOT_MODE;

@Entity('config')
export class Config {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    key: string = '';

    @Column()
    value: string = '';

    @Column({ default: true })
    isActive: boolean = false;

    @Column()
    note: string = '';

    @Column()
    mode: string = ''; 
}

export async function getConfig(key: string): Promise<string | null> {
    try {
        const configRepository = AppDataSource.getRepository(Config);
        const config = await configRepository.findOne({ where: { key: key, isActive: true, mode: botConfig } });
        return config ? config.value : null;
    } catch (e) {
        errorLogger.error(`Error in getConfig: ${e}`);
        return null;
    } 
}
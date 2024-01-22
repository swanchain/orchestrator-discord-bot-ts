import {Entity, PrimaryGeneratedColumn, Column  } from "typeorm";
import { errorLogger } from '../log/logger';
import { AppDataSource} from '../../data-source';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number = 0;

    @Column()
    discord_id: string = '';

    @Column()
    discord_name: string = '';

    @Column()
    from_wallet_address: string = '';

    @Column()
    to_wallet_address: string = '';

    @Column('timestamp', { default: () => "CURRENT_TIMESTAMP"})
    last_claim_time: Date = new Date();

    @Column('float')
    claimed_amount: number = 0;

    @Column()
    transaction_hash: string = '';

    @Column()
    token_symbol: string = '';
}

export async function setUserClaimInfo(discord_id: string, discord_name: string, from_wallet_address: string,
    to_wallet_address: string, claimed_amount: number, tx_hash: string, token_symbol: string): Promise<void> {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = new User();
        user.discord_id = discord_id;
        user.discord_name = discord_name;
        user.from_wallet_address = from_wallet_address;
        user.to_wallet_address = to_wallet_address;
        user.claimed_amount = claimed_amount;
        user.transaction_hash = tx_hash;
        user.token_symbol = token_symbol;
        await userRepository.save(user);
    } catch (e) {
        errorLogger.error(`Error in setUserClaimInfo: ${e}`);
    }
}
import Web3 from 'web3';
import { getConfig } from '../model/config';
import { errorLogger } from '../log/logger';
import { getRepository } from 'typeorm';
import { User } from '../model/user';
import { isAddress } from 'web3-validator'
import winston from 'winston';
import { AppDataSource } from '../../data-source';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

class UserService {
  private commonAbi = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

    async transfer(network: string, tokenName: string, fromWalletAddress: string, toWalletAddress: string, claimedAmount: string, isTest = false): Promise<string> {
      const rpcEndpointKey = `${network}_${isTest ? "TEST_" : ""}RPC_ENDPOINT`;
      const rpcEndpoint = await getConfig(rpcEndpointKey) || '';

      const web3 = new Web3(rpcEndpoint);

      const contractKey = `${network}_${isTest ? "TEST_" : ""}CONTRACT_ADDRESS`;
      const contractAddress = await getConfig(contractKey);
      const contract = contractAddress ? new web3.eth.Contract(this.commonAbi, contractAddress) : null;
      if (contract == null) {
        errorLogger.error('Contract is null.')
        return '';
      }
      if (!isAddress(toWalletAddress) || !isAddress(fromWalletAddress)) {
        errorLogger.error(`Invalid wallet address. From: ${fromWalletAddress}, To: ${toWalletAddress}`);
        return '';
      }

      // check if the wallet has enough balance
      const balance = await contract.methods.balanceOf(fromWalletAddress).call() as number;
      if (balance < parseInt(claimedAmount)) {
        errorLogger.error(`Insufficient balance. Balance: ${balance}, Claimed amount: ${claimedAmount}`);
        return '';
      }

      // check if the wallet has enough gas
      const gasPrice = await web3.eth.getGasPrice();
      const gasEstimate = await contract.methods.transfer(toWalletAddress, claimedAmount).estimateGas({
        from: fromWalletAddress,
        gasPrice: gasPrice.toString(),
      });
      const gasCost = gasEstimate * BigInt(gasPrice);
      const walletBalance = await web3.eth.getBalance(fromWalletAddress);
      if (gasCost > walletBalance) {
        errorLogger.error(`Insufficient gas. Gas cost: ${gasCost}, Wallet balance: ${walletBalance}`);
        return '';
      }
      const privateKey = await getConfig('PRIVATE_KEY');
      if (privateKey === null) {
        errorLogger.error(`Private key is null.`);
        return '';
      }
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      const nonce = await web3.eth.getTransactionCount(account.address);

      try {
        const tx = contract.methods.transfer(toWalletAddress, claimedAmount).encodeABI();
        const transaction = {
          'from': fromWalletAddress,
          'to': contractAddress,
          'gas': gasEstimate,
          'gasPrice': gasPrice,
          'nonce': nonce,
          'data': tx
        };
        const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
        const txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        const txnReceipt = await web3.eth.getTransactionReceipt(txHash.toString());

        logger.info(`-- Transaction successful with transaction hash: ${web3.utils.bytesToHex(txHash.transactionHash)} at ${new Date().toISOString()}`);
        logger.info(`-- Transaction receipt: ${txnReceipt}`);
        logger.info(`-- Gas used: ${txnReceipt["gasUsed"]} for transaction hash: ${web3.utils.bytesToHex(txHash.transactionHash)} at ${new Date().toISOString()}`);
        return web3.utils.bytesToHex(txHash.transactionHash);
        } catch (e) {
          errorLogger.error(`Failed to transfer to ${toWalletAddress}, error: ${e}`);
          return '';
      }
    
  }

  async recordUserTransaction(discordId: string, discordName: string, fromWalletAddress: string, toWalletAddress: string, claimedAmount: string, txHash: string, tokenSymbol: string): Promise<boolean> {
    logger.info(`-- Recording user transaction for ${discordName} at ${new Date().toISOString()}`);
    const userRepository = AppDataSource.getRepository(User);
    const user = new User();
    user.discord_id = discordId;
    user.discord_name = discordName;
    user.from_wallet_address = fromWalletAddress;
    user.to_wallet_address = toWalletAddress;
    user.claimed_amount = parseInt(claimedAmount);
    user.transaction_hash = txHash;
    user.token_symbol = tokenSymbol;
    try {
        await userRepository.save(user);
          return true;
      } catch (e) {
          errorLogger.error(`Failed to insert transaction: ${e}`);
          return false;
      }
  }

  async transferAndRecord(discordId: string, discordName: string, network: string, tokenName: string, fromWalletAddress: string, toWalletAddress: string, claimedAmount: string, tokenSymbol: string, isTest = false): Promise<string | null> {
    const rpcEndpointKey = `${network}_${isTest ? "TEST_" : ""}RPC_ENDPOINT`;
    const rpcEndpoint = await getConfig(rpcEndpointKey) || '';

    const web3 = new Web3(rpcEndpoint);
    if (network === 'OPSWAN') {
      claimedAmount = web3.utils.toWei(Number(claimedAmount).toString(), 'mwei');
    } else {
      claimedAmount = web3.utils.toWei(Number(claimedAmount).toString(), 'ether');

    const txHash = await this.transfer(network, tokenName, fromWalletAddress, toWalletAddress, claimedAmount, isTest);
      if (txHash === null) {
        return null;
      }

      const isSuccess = await this.recordUserTransaction(discordId, discordName, fromWalletAddress, toWalletAddress, claimedAmount, txHash, tokenSymbol);
      if (!isSuccess) {
        return null;
      }
        return txHash;
      }
  }
}
export const handleFaucetCommand = async (address: string, id:string) => {
    // Call when user use /get_swan command


};

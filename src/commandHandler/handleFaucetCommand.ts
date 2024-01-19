import Web3 from 'web3';
import { getConfig } from '../model/config';
import { errorLogger } from '../log/logger';
import { setUserClaimInfo } from '../model/user';

class UserService {
    private commonAbi = [
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "balance",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ];

    async transfer(network: string, tokenName: string, fromWalletAddress: string, toWalletAddress: string, claimedAmount: number, isTest = false): Promise<void> {
      const rpcEndpointKey = `${network}_${isTest ? "TEST_" : ""}RPC_ENDPOINT`;
      const web3 = new Web3(await getConfig(rpcEndpointKey));

      const contractKey = `${tokenName}_${isTest ? "TEST_" : ""}CONTRACT_ADDRESS`;
      const contractAddress = await getConfig(contractKey);
      if (contractAddress === null) {
        errorLogger.error(`Contract address is null.`);
        return;
      }
      const contract = new web3.eth.Contract(this.commonAbi, contractAddress);

      if (!web3.utils.isAddress(toWalletAddress) || !web3.utils.isAddress(fromWalletAddress)) {
        errorLogger.error(`Invalid wallet address. From: ${fromWalletAddress}, To: ${toWalletAddress}`);
        return;
      }

      // check if the wallet has enough balance
      const balance = await contract.methods.balanceOf(fromWalletAddress).call() as number;
      if (balance < claimedAmount) {
        errorLogger.error(`Insufficient balance. Balance: ${balance}, Claimed amount: ${claimedAmount}`);
        return;
      }

      // check if the wallet has enough gas
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.transfer(toWalletAddress, claimedAmount).estimateGas({
          from: fromWalletAddress,
          gasPrice: gasPrice.toString(),
        });
        let gasLimit = Math.floor(Number(gasEstimate) * 1.5);
        const gasCost = gasEstimate * BigInt(gasPrice);
        const walletBalance = await web3.eth.getBalance(fromWalletAddress);
        if (gasCost > walletBalance) {
          errorLogger.error(`Insufficient gas. Gas cost: ${gasCost}, Wallet balance: ${walletBalance}`);
          return;
        }
      const privateKey = await getConfig('PRIVATE_KEY');
      if (privateKey === null) {
        errorLogger.error(`Private key is null.`);
        return;
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
          return txHash.toString() as string;
        } catch (e) {
          errorLogger.error(`Failed to transfer to ${toWalletAddress}, error: ${e}`);
          return null;
      }
  }

  async recordUserTransaction(discordId: string, discordName: string, fromWalletAddress: string, toWalletAddress: string, claimedAmount: number, txHash: string, tokenSymbol: string): Promise<boolean> {
      try {
          await setUserClaimInfo(discordId, discordName, fromWalletAddress, toWalletAddress, claimedAmount, txHash, tokenSymbol);
          return true;
      } catch (e) {
          errorLogger.error(`Failed to insert transaction: ${e}`);
          return false;
      }
  }

  async transferAndRecord(discordId: string, discordName: string, network: string, tokenName: string, fromWalletAddress: string, toWalletAddress: string, claimedAmount: number, tokenSymbol: string, isTest = false): Promise<string | null> {
    const web3 = new Web3(await getConfig(`${network}_${isTest ? "TEST_" : ""}RPC_ENDPOINT`));
    if (tokenName === 'OPSWAN' || tokenName === 'POLYGON_USDC') {
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

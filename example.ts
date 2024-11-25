import { pumpFunBuy, pumpFunSell } from './src/swap';
import { TransactionMode } from './src/types'

/** 使用说明
 *  --生成私钥
 *  使用 solana.web3 Keypair
 *  const newKeypair = Keypair.generate();
    const newKeypairArray = Array.from(newKeypair.secretKey);
    const newPrivateKey = bs58.encode(newKeypair.secretKey);

    bs58 编码的私钥是你需要放入下面的私钥。这是一个 88 字符的字符串，
    与从 Phantom 钱包导出的私钥相匹配。
 */

const solIn = 0.0001; // 你想用来购买代币的 SOL（Solana）数量
const slippageDecimal = 0.25; //滑点,设置一个滑点是为了防止价格波动过大导致交易失败。
const tokenBalance = 1000; // 这是你打算出售的代币数量
const priorityFeeInSol = 0.0001; // 快交易确认而愿意支付的额外费用
const privateKey = '4JUw8pej53PzukWnRnKPfQsYPopbGCeuVNSWH8f6t7W7XkkRycbDuRSDZHcE5WL6EVuqtU3a6YWJA1X9dHPGgrsa'; // 替换为你的实际私钥
const mintAddress = ''; // 替换为实际的代币铸造地址
const txMode = TransactionMode.Execution; // 设置为 simulate 进行测试，Execution 进行执行


class Example {
    private payerPrivateKey: string;
    private mintAddress: string;
    private transactionMode: TransactionMode;

    constructor(privateKey: string, mintAddress: string, mode: TransactionMode) {
        this.payerPrivateKey = privateKey;
        this.mintAddress = mintAddress;
        this.transactionMode = mode;
    }

    async main() {

        try {
            // 调用买入函数
            // await pumpFunBuy(this.transactionMode, this.payerPrivateKey, this.mintAddress, solIn, priorityFeeInSol, slippageDecimal);

            // 调用卖出函数
            await pumpFunSell(this.transactionMode, this.payerPrivateKey, this.mintAddress, tokenBalance, priorityFeeInSol, slippageDecimal);
        } catch (error) {
            console.error('主函数出错:', error);
        }
    }
}


const example = new Example(privateKey, mintAddress, txMode);
example.main();
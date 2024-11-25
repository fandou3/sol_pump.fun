import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getKeyPairFromPrivateKey, createTransaction, sendAndConfirmTransactionWrapper, bufferFromUInt64 } from './utils';
import { getCoinData } from './api';
import { TransactionMode } from './types';
import { GLOBAL, FEE_RECIPIENT, SYSTEM_PROGRAM_ID, RENT, PUMP_FUN_ACCOUNT, PUMP_FUN_PROGRAM, ASSOC_TOKEN_ACC_PROG } from './constants';

/**
 * 购买PumpFun代币的函数
 * @param {TransactionMode} transactionMode - 交易模式（执行或模拟）
 * @param {string} payerPrivateKey - 支付者的私钥
 * @param {string} mintStr - 代币的mint地址
 * @param {number} solIn - 用于购买的SOL数量
 * @param {number} priorityFeeInSol - 优先费用（可选）
 * @param {number} slippageDecimal - 滑点（可选）
 */
export async function pumpFunBuy(transactionMode:any, payerPrivateKey:any, mintStr:any, solIn:any, priorityFeeInSol = 0, slippageDecimal = 0.25) {
    try {
        // 创建与Solana主网的连接
        const connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');

        // 获取代币数据
        const coinData = await getCoinData(mintStr);
        if (!coinData) {
            console.error('无法获取代币数据...');
            return;
        }

        // 从私钥获取支付者的密钥对
        const payer = await getKeyPairFromPrivateKey(payerPrivateKey);
        const owner = payer.publicKey;
        const mint = new PublicKey(mintStr);

        // 创建交易对象
        const txBuilder = new Transaction();

        // 获取或创建关联的代币账户地址
        const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

        let tokenAccount;
        if (!tokenAccountInfo) {
            // 如果代币账户不存在，则创建
            txBuilder.add(
                createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint)
            );
            tokenAccount = tokenAccountAddress;
        } else {
            tokenAccount = tokenAccountAddress;
        }

        // 计算购买代币所需的lamports和滑点调整
        const solInLamports = solIn * LAMPORTS_PER_SOL;
        const tokenOut = Math.floor(solInLamports * coinData["virtual_token_reserves"] / coinData["virtual_sol_reserves"]);
        const solInWithSlippage = solIn * (1 + slippageDecimal);
        const maxSolCost = Math.floor(solInWithSlippage * LAMPORTS_PER_SOL);

        // 定义交易所需的公钥
        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData['bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData['associated_bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false },
        ];

        // 准备交易指令数据
        const data = Buffer.concat([
            bufferFromUInt64("16927863322537952870"), // 特定于程序的指令标识符
            bufferFromUInt64(tokenOut), // 购买的代币数量
            bufferFromUInt64(maxSolCost) // 最大支付的SOL数量
        ]);

        // 创建交易指令并添加到交易中
        const instruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });
        txBuilder.add(instruction);

        // 创建完整的交易对象
        const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey, priorityFeeInSol);

        // 根据交易模式执行或模拟交易
        if (transactionMode == TransactionMode.Execution) {
            const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);
            console.log('购买交易确认:', signature);
        } else if (transactionMode == TransactionMode.Simulation) {
            const simulatedResult = await connection.simulateTransaction(transaction);
            console.log(simulatedResult);
        }
    } catch (error) {
        console.log(error);
    }
}

/**
 * 出售PumpFun代币的函数
 * @param {TransactionMode} transactionMode - 交易模式（执行或模拟）
 * @param {string} payerPrivateKey - 支付者的私钥
 * @param {string} mintStr - 代币的mint地址
 * @param {number} tokenBalance - 出售的代币数量
 * @param {number} priorityFeeInSol - 优先费用（可选）
 * @param {number} slippageDecimal - 滑点（可选）
 */
export async function pumpFunSell(transactionMode:any, payerPrivateKey:any, mintStr:any, tokenBalance:any, priorityFeeInSol = 0, slippageDecimal = 0.25) {
    try {
        // 创建与Solana主网的连接
        const connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');

        // 获取代币数据
        const coinData = await getCoinData(mintStr);
        if (!coinData) {
            console.error('无法获取代币数据...');
            return;
        }

        // 从私钥获取支付者的密钥对
        const payer = await getKeyPairFromPrivateKey(payerPrivateKey);
        const owner = payer.publicKey;
        const mint = new PublicKey(mintStr);

        // 创建交易对象
        const txBuilder = new Transaction();

        // 获取或创建关联的代币账户地址
        const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);

        let tokenAccount;
        if (!tokenAccountInfo) {
            // 如果代币账户不存在，则创建
            txBuilder.add(
                createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccountAddress, payer.publicKey, mint)
            );
            tokenAccount = tokenAccountAddress;
        } else {
            tokenAccount = tokenAccountAddress;
        }

        // 计算出售代币后的最小SOL输出
        const minSolOutput = Math.floor(tokenBalance * (1 - slippageDecimal) * coinData["virtual_sol_reserves"] / coinData["virtual_token_reserves"]);

        // 定义交易所需的公钥
        const keys = [
            { pubkey: GLOBAL, isSigner: false, isWritable: false },
            { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: new PublicKey(coinData['bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(coinData['associated_bonding_curve']), isSigner: false, isWritable: true },
            { pubkey: tokenAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
            { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false }
        ];

        // 准备交易指令数据
        const data = Buffer.concat([
            bufferFromUInt64("12502976635542562355"), // 特定于程序的指令标识符
            bufferFromUInt64(tokenBalance), // 出售的代币数量
            bufferFromUInt64(minSolOutput) // 最小接收的SOL数量
        ]);

        // 创建交易指令并添加到交易中
        const instruction = new TransactionInstruction({
            keys: keys,
            programId: PUMP_FUN_PROGRAM,
            data: data
        });
        txBuilder.add(instruction);

        // 创建完整的交易对象
        const transaction = await createTransaction(connection, txBuilder.instructions, payer.publicKey, priorityFeeInSol);

        // 根据交易模式执行或模拟交易
        if (transactionMode == TransactionMode.Execution) {
            const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);
            console.log('出售交易确认:', signature);
        } else if (transactionMode == TransactionMode.Simulation) {
            const simulatedResult = await connection.simulateTransaction(transaction);
            console.log(simulatedResult);
        }
    } catch (error) {
        console.log(error);
    }
}
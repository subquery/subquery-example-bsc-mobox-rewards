import { Pool, PoolEvent } from "../types";
import { DepositLog, WithdrawLog } from "../types/abi-interfaces/MoboxAbi";

async function checkGetPool(id: string): Promise<Pool> {
  let poolRecord = await Pool.get(id);
  if (!poolRecord) {
    poolRecord = Pool.create({
      id: id,
      totalSize: BigInt(0),
    });
    await poolRecord.save();
  }
  return poolRecord;
}

export async function handleDeposit(deposit: DepositLog): Promise<void> {
  logger.info(`New deposit transaction log at block ${deposit.blockNumber}`);
  const poolId = deposit.args[1].toString();

  const poolRecord = await checkGetPool(poolId);

  const poolEventRecord = PoolEvent.create({
    id: `${deposit.transactionHash}-${deposit.logIndex}`,
    user: deposit.args[0],
    poolId,
    type: "DEPOSIT",
    value: deposit.args[2].toBigInt(),
    block: BigInt(deposit.blockNumber),
    timestamp: deposit.block.timestamp,
  });
  await poolEventRecord.save();

  poolRecord.totalSize += poolEventRecord.value;
  await poolRecord.save();
}

export async function handleWithdraw(withdraw: WithdrawLog): Promise<void> {
  logger.info(`New withdraw transaction log at block ${withdraw.blockNumber}`);
  const poolId = withdraw.args[1].toString();

  const poolRecord = await checkGetPool(poolId);

  const poolEventRecord = PoolEvent.create({
    id: `${withdraw.transactionHash}-${withdraw.logIndex}`,
    user: withdraw.args[0],
    poolId,
    type: "WITHDRAW",
    value: withdraw.args[2].toBigInt(),
    block: BigInt(withdraw.blockNumber),
    timestamp: withdraw.block.timestamp,
  });
  await poolEventRecord.save();

  poolRecord.totalSize -= poolEventRecord.value;
  await poolRecord.save();
}

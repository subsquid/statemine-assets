import { EventHandlerContext } from "@subsquid/substrate-processor";
import { Store } from "@subsquid/typeorm-store";
import { Account, HistoricalBalance, Transfer, TransferType } from "../model";

import { BalancesDepositEvent, BalancesTransferEvent } from "../types/events";
import { get, getOrCreate } from "./helpers/entity-utils";

export async function balancesTransfer(ctx: EventHandlerContext<Store>) {
  let event = new BalancesTransferEvent(ctx);
  if (event.isV1) {
    var [from, to, value] = event.asV1;
  }
  else if (event.isV700) {
    var {from, to, amount: value} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }

  const tip = ctx.event.extrinsic?.tip || 0n;

  const fromAcc = await getOrCreate(ctx.store, Account, from.toString());
  fromAcc.wallet = from.toString();
  fromAcc.balance = fromAcc.balance || 0n;
  fromAcc.balance -= value;
  fromAcc.balance -= tip;
  await ctx.store.save(fromAcc);

  const toAcc = await getOrCreate(ctx.store, Account, to.toString());
  toAcc.wallet = to.toString();
  toAcc.balance = toAcc.balance || 0n;
  toAcc.balance += value;
  await ctx.store.save(toAcc);

  const hbFrom = new HistoricalBalance();
  hbFrom.account = fromAcc;
  hbFrom.balance = fromAcc.balance;
  hbFrom.timestamp = new Date(ctx.block.timestamp);
  await ctx.store.save(hbFrom);

  const hbTo = new HistoricalBalance();
  hbTo.account = toAcc;
  hbTo.balance = toAcc.balance;
  hbTo.timestamp = new Date(ctx.block.timestamp);
  await ctx.store.save(hbTo);

  const transfer = new Transfer();
  transfer.amount = value;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.extrinisicId = ctx.event.extrinsic?.id;
  transfer.from = from.toString();
  transfer.to = to.toString();
  transfer.success = true;
  transfer.id = ctx.event.id;
  transfer.type = TransferType.REGULAR;
  transfer.createdAt = new Date(ctx.block.timestamp);

  await ctx.store.save(transfer);
}

export async function transferFee(ctx: EventHandlerContext<Store>) {
  let event = new BalancesDepositEvent(ctx);
  if (event.isV1) {
    var [, fees] = event.asV1;
  }
  else if (event.isV700) {
    var {who, amount: fees} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }

  if (ctx.event.extrinsic?.id) {
    const transfer = await get(ctx.store, Transfer, ctx.event.extrinsic?.id);
    if (!transfer) {
      // console.error("No transfer found for deposit event", event.id);
      return;
    }
    transfer.fee = fees;
    await ctx.store.save(transfer);
  } else {
    console.error("Extrinsic Null for deposit event ", ctx.event.id);
  }
}

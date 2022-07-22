import {
  Account,
  Asset,
  AssetBalance,
  AssetStatus,
  Transfer,
  TransferType,
} from "../model/generated";
import { getAssetBalanceId } from "./helpers/common";
import { get, getOrCreate } from "./helpers/entity-utils";
import { EventHandlerContext } from "@subsquid/substrate-processor";
import { Store } from "@subsquid/typeorm-store/lib/store";
import { AssetsCreateCall } from "../types/calls";
import * as events from "../types/events";
import  assert  from "assert"

/**
 * Get asset from database
 * @param {string} assetId
 * @param {Store} store
 * @returns {Promise<Asset>}
 */
export async function getAssetById(
  assetId: string,
  store: Store
): Promise<Asset> {
  const asset = await get(store, Asset, assetId.toString());
  if (!asset) {
    console.error("No asset found for id", assetId.toString());
    process.exit(1);
  }
  return asset;
}

/**
 * Get all details of asset for an account
 * @param {DatabaseManager} store
 * @param {Asset | string} asset  or assetId
 * @param {string} wallet
 * @returns
 */
export async function getAssetAccountDetails(
  store: Store,
  asset: Asset | string,
  accountId: string
): Promise<[Asset, Account, AssetBalance]> {
  if (typeof asset == "string") {
    asset = await getAssetById(asset, store);
  }
  const id = getAssetBalanceId(asset.id, accountId);
  const getOwnerAccount = getOrCreate(store, Account, accountId);
  const getOwnerAssetBalance = getOrCreate(store, AssetBalance, id);
  const [account, assetBalance] = await Promise.all([
    getOwnerAccount,
    getOwnerAssetBalance,
  ]);

  if (!account.wallet) {
    account.wallet = accountId;
    account.balance = account.balance || 0n;
    await store.save(account);
  }
  assetBalance.status = assetBalance.status
    ? assetBalance.status
    : AssetStatus.ACTIVE;
  return [asset, account, assetBalance];
}

/**
 * update asset balance
 * @param {Store}store
 * @param {Asset | string}asset  or assetId
 * @param {string}wallet
 * @param {bigint} amount
 * @returns {Promise<[Asset, Account, AssetBalance]>}
 */

export async function changeAssetBalance(ctx: EventHandlerContext<Store, {event: {args: true}}>, assetId: Asset | string, wallet: string, amount: bigint): Promise<[Asset, Account, AssetBalance]> {
  const [asset, account, assetBalance] = await getAssetAccountDetails(
    ctx.store,
    assetId,
    wallet
  );

  assetBalance.asset = asset;
  assetBalance.balance = assetBalance.balance || 0n + amount;
  assetBalance.account = account;
  await ctx.store.save(assetBalance);
  return [asset, account, assetBalance];
}

export async function assetCreated(ctx: EventHandlerContext<Store, {event: true}>) {
  let event = new events.AssetsCreatedEvent(ctx);
  if (event.isV1) {
    var [assetId, creator, owner] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, creator, owner} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = new Asset();
  asset.id = assetId.toString();
  asset.creator = creator.toString();
  asset.owner = owner.toString();
  asset.freezer = asset.admin = asset.owner;
  asset.status = AssetStatus.ACTIVE;
  assert(ctx.event.call);
  const call = new AssetsCreateCall(ctx, ctx.event.call);
  const {id, admin, minBalance} = call.asV504;
  asset.minBalance = minBalance;  // параметр колла event.call.args;
  asset.totalSupply = 0n;

  await ctx.store.save(asset);
}

export async function assetOwnerChanged(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsOwnerChangedEvent(ctx);
  if (event.isV1) {
    var [assetId, owner] = event.asV1;
  }
  else if (event.isV700) {
    var { assetId, owner } = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);
  asset.owner = owner.toString();
  await ctx.store.save(asset);
}

export async function assetTeamChanged(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsTeamChangedEvent(ctx);
  if (event.isV1) {
    var [assetId, issuer, admin, freezer] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, issuer, admin, freezer} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);

  asset.issuer = issuer.toString();
  asset.admin = admin.toString();
  asset.freezer = freezer.toString();

  await ctx.store.save(asset);
}

export async function assetFrozen(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsAssetFrozenEvent(ctx);
  if (event.isV1) {
    var assetId = event.asV1;
  }
  else if (event.isV700) {
    var {assetId} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);

  asset.status = AssetStatus.FREEZED;

  await ctx.store.save(asset);
}

export async function assetThawed(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsAssetThawedEvent(ctx);  //TODO: CHECK VERSIONs
  if (event.isV1) {
    var assetId = event.asV1;
  }
  else if (event.isV700) {
    var {assetId} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);

  asset.status = AssetStatus.ACTIVE;

  await ctx.store.save(asset);
}

export async function assetDestroyed(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsDestroyedEvent(ctx);
  if (event.isV1) {
    var assetId = event.asV1;
  }
  else if (event.isV700) {
    var {assetId} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);

  asset.status = AssetStatus.DESTROYED;

  await ctx.store.save(asset);
}

export async function assetMetadataSet(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsMetadataSetEvent(ctx);
  if (event.isV1) {
    var [assetId, name, symbol, decimals, isFrozen] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, name, symbol, decimals, isFrozen} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);
  asset.name = String.fromCharCode(...name);
  asset.symbol = String.fromCharCode(...symbol);
  asset.decimal = decimals;
  asset.status = isFrozen ? AssetStatus.FREEZED : AssetStatus.ACTIVE;
  await ctx.store.save(asset);
}

export async function assetMetadataCleared(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsMetadataClearedEvent(ctx);
  if (event.isV1) {
    var assetId = event.asV1;
  }
  else if (event.isV700) {
    var {assetId} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const asset = await getAssetById(assetId.toString(), ctx.store);
  asset.name = null;
  asset.symbol = null;
  asset.decimal = null;
  await ctx.store.save(asset);
}

export async function assetIssued(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsIssuedEvent(ctx);
  if (event.isV1) {
    var [assetId, owner, totalSupply] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, owner, totalSupply} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    owner.toString(),
    totalSupply
  );
  asset.totalSupply = asset.totalSupply || 0n + totalSupply

  await ctx.store.save(asset);

  const transfer = new Transfer();
  transfer.amount = totalSupply
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;    //TODO: Where did block come from
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.to = owner.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.MINT;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetTransfer(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsTransferredEvent(ctx);
  if (event.isV1) {
    var [assetId, from, to, amount] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, from, to, amount} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    from.toString(),
    BigInt(-amount) // decrements from sender account
  );

  await changeAssetBalance(ctx, asset, to.toString(), amount);

  const transfer = new Transfer();
  transfer.amount = amount;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.to = to.toString();
  transfer.from = from.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.REGULAR;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetBalanceBurned(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsBurnedEvent(ctx);
  if (event.isV1) {
    var [assetId, owner, balance] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, owner, balance} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    owner.toString(),
    BigInt(-balance) // decrements from account
  );

  const transfer = new Transfer();
  transfer.amount = balance;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.from = owner.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.BURN;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetTransferredApproved(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsTransferredApprovedEvent(ctx);
  if (event.isV1) {
    var [assetId, owner, delegate, destination, amount] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, owner, delegate, destination, amount} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    owner.toString(),
    BigInt(-amount) // decrements from sender account
  );

  await changeAssetBalance(ctx, asset, destination.toString(), amount);

  const transfer = new Transfer();
  transfer.amount = amount;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash; 
  transfer.to = destination.toString();
  transfer.from = owner.toString();
  transfer.delegator = delegate.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.DELEGATED;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetAccountFrozen(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsFrozenEvent(ctx);
  if (event.isV1) {
    var [assetId, who] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, who} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const [asset, , assetBalance] = await getAssetAccountDetails(
    ctx.store,
    assetId.toString(),
    who.toString()
  );
  assetBalance.status = AssetStatus.FREEZED;
  await ctx.store.save(assetBalance);

  const transfer = new Transfer();
  transfer.amount = assetBalance.balance;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.from = who.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.FREEZE;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetBalanceThawed(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsThawedEvent(ctx);
  if (event.isV1) {
    var [assetId, who] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, who} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  const [asset, , assetBalance] = await getAssetAccountDetails(
    ctx.store,
    assetId.toString(),
    who.toString()
  );
  assetBalance.status = AssetStatus.ACTIVE;
  await ctx.store.save(assetBalance);

  const transfer = new Transfer();
  transfer.amount = assetBalance.balance;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.from = who.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.THAWED;
  transfer.success = true;
  await ctx.store.save(transfer);
}
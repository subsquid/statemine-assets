import {
  Account,
  Asset,
  AssetBalance,
  AssetStatus,
  Transfer,
  TransferType,
} from "../model/generated";
import { getAssetBalanceId } from "./helpers/common";
import { encodeId, get, getOrCreate, isAdressSS58 } from "./helpers/entity-utils";
import { AssetsCreateCall } from "../types/calls";
import * as events from "../types/events";
import  assert  from "assert"
import { Store } from "@subsquid/typeorm-store";
import { EventHandlerContext } from "@subsquid/substrate-processor";

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
    var [assetId, creatorA, ownerA] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, creator: creatorA, owner: ownerA} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let creator = isAdressSS58(creatorA) ? encodeId(creatorA) : null;
  let owner = isAdressSS58(ownerA) ? encodeId(ownerA) : null;
  if (!owner) return;
  const asset = new Asset();
  asset.id = assetId.toString();
  asset.creator = creator;
  asset.owner = owner;
  asset.freezer = asset.admin = asset.owner;
  asset.status = AssetStatus.ACTIVE;
  assert(ctx.event.call);
  try {
    const call = new AssetsCreateCall(ctx, ctx.event.call);
    const {id, admin, minBalance} = call.asV504;
    asset.minBalance = minBalance;  // параметр колла event.call.args;
  }
  catch (err) {
    const call = ctx.event.call.args?.calls?.find((c: {__kind: string, value: any}) => 
      c.__kind === 'Assets' && c.value && c.value.__kind === 'create'
    );
    call && (asset.minBalance = call.value.minBalance ? BigInt(call.value.minBalance) : null);
  }
  asset.totalSupply = 0n;

  await ctx.store.save(asset);
}

export async function assetOwnerChanged(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsOwnerChangedEvent(ctx);
  if (event.isV1) {
    var [assetId, ownerA] = event.asV1;
  }
  else if (event.isV700) {
    var { assetId, owner: ownerA } = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let owner = isAdressSS58(ownerA) ? encodeId(ownerA) : null;
  if (!owner) return;
  const asset = await getAssetById(assetId.toString(), ctx.store);
  asset.owner = owner;
  await ctx.store.save(asset);
}

export async function assetTeamChanged(ctx: EventHandlerContext<Store, {event: {args: true}}>) {
  let event = new events.AssetsTeamChangedEvent(ctx);
  if (event.isV1) {
    var [assetId, issuerA, adminA, freezerA] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, issuer: issuerA, admin: adminA, freezer: freezerA} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let issuer = isAdressSS58(issuerA) ? encodeId(issuerA) : null;
  let admin = isAdressSS58(adminA) ? encodeId(adminA) : null;
  let freezer = isAdressSS58(freezerA) ? encodeId(freezerA) : null;
  const asset = await getAssetById(assetId.toString(), ctx.store);

  asset.issuer = issuer;
  asset.admin = admin;
  asset.freezer = freezer;

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
    var [assetId, ownerA, totalSupply] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, owner: ownerA, totalSupply} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let owner = isAdressSS58(ownerA) ? encodeId(ownerA) : null;
  if (!owner) return;
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    owner,
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
  transfer.to = owner;
  transfer.id = ctx.event.id;
  transfer.type = TransferType.MINT;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetTransfer(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsTransferredEvent(ctx);
  if (event.isV1) {
    var [assetId, fromA, toA, amount] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, from: fromA, to: toA, amount} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let to = isAdressSS58(toA) ? encodeId(toA) : null;
  let from = isAdressSS58(fromA) ? encodeId(fromA) : null;
  if (!from || !to) return;
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    from,
    BigInt(-amount) // decrements from sender account
  );

  await changeAssetBalance(ctx, asset, to, amount);

  const transfer = new Transfer();
  transfer.amount = amount;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.to = to;
  transfer.from = from;
  transfer.id = ctx.event.id;
  transfer.type = TransferType.REGULAR;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetBalanceBurned(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsBurnedEvent(ctx);
  if (event.isV1) {
    var [assetId, ownerA, balance] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, owner: ownerA, balance} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let owner = isAdressSS58(ownerA) ? encodeId(ownerA) : null;
  if (!owner) return;
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    owner,
    BigInt(-balance) // decrements from account
  );

  const transfer = new Transfer();
  transfer.amount = balance;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash;
  transfer.from = owner;
  transfer.id = ctx.event.id;
  transfer.type = TransferType.BURN;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetTransferredApproved(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsTransferredApprovedEvent(ctx);
  if (event.isV1) {
    var [assetId, ownerA, delegate, destinationA, amount] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, owner: ownerA, delegate, destination: destinationA, amount} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let owner = isAdressSS58(ownerA) ? encodeId(ownerA) : null;
  let destination = isAdressSS58(destinationA) ? encodeId(destinationA) : null;
  if (!owner || !destination) return;
  const [asset] = await changeAssetBalance(
    ctx,
    assetId.toString(),
    owner,
    BigInt(-amount) // decrements from sender account
  );

  await changeAssetBalance(ctx, asset, destination, amount);

  const transfer = new Transfer();
  transfer.amount = amount;
  transfer.asset = asset;
  transfer.blockHash = ctx.block.hash;
  transfer.blockNum = ctx.block.height;
  transfer.createdAt = new Date(ctx.block.timestamp);
  transfer.extrinisicId = ctx.event.extrinsic?.hash; 
  transfer.to = destination;
  transfer.from = owner;
  transfer.delegator = delegate.toString();
  transfer.id = ctx.event.id;
  transfer.type = TransferType.DELEGATED;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetAccountFrozen(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsFrozenEvent(ctx);
  if (event.isV1) {
    var [assetId, whoA] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, who: whoA} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let who = isAdressSS58(whoA) ? encodeId(whoA) : null;
  if (!who) return;
  const [asset, , assetBalance] = await getAssetAccountDetails(
    ctx.store,
    assetId.toString(),
    who
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
  transfer.from = who;
  transfer.id = ctx.event.id;
  transfer.type = TransferType.FREEZE;
  transfer.success = true;
  await ctx.store.save(transfer);
}

export async function assetBalanceThawed(ctx: EventHandlerContext<Store>) {
  let event = new events.AssetsThawedEvent(ctx);
  if (event.isV1) {
    var [assetId, whoA] = event.asV1;
  }
  else if (event.isV700) {
    var {assetId, who: whoA} = event.asV700;
  }
  else {
    throw event.constructor.name;
  }
  let who = isAdressSS58(whoA) ? encodeId(whoA) : null;
  if (!who) return;
  const [asset, , assetBalance] = await getAssetAccountDetails(
    ctx.store,
    assetId.toString(),
    who
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
  transfer.from = who;
  transfer.id = ctx.event.id;
  transfer.type = TransferType.THAWED;
  transfer.success = true;
  await ctx.store.save(transfer);
}
import { AccountId32 } from "@polkadot/types/interfaces";
import {
  DatabaseManager,
  EventContext,
  StoreContext,
} from "@subsquid/hydra-common";
import {
  Account,
  Asset,
  AssetBalance,
  AssetStatus,
  Transfer,
  TransferType,
} from "../generated/model";
import { Assets } from "../types/index";
import { getAssetBalanceId } from "./helpers/common";
import { get, getOrCreate } from "./helpers/entity-utils";

/**
 * Get asset from database
 * @param {string} assetId
 * @param {DatabaseManager} store
 * @returns {Promise<Asset>}
 */
export async function getAssetById(
  assetId: string,
  store: DatabaseManager
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
  store: DatabaseManager,
  asset: Asset | string,
  wallet: AccountId32
): Promise<[Asset, Account, AssetBalance]> {
  if (typeof asset == "string") {
    asset = await getAssetById(asset, store);
  }
  const accountId = wallet.toHex();
  const id = getAssetBalanceId(asset.id, accountId);
  const getOwnerAccount = getOrCreate(store, Account, accountId);
  const getOwnerAssetBalance = getOrCreate(store, AssetBalance, id);
  const [account, assetBalance] = await Promise.all([
    getOwnerAccount,
    getOwnerAssetBalance,
  ]);

  if (!account.wallet) {
    account.wallet = wallet.toHuman();
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
 * @param {DatabaseManager}store
 * @param {Asset | string}asset  or assetId
 * @param {string}wallet
 * @param {bigint} amount
 * @returns {Promise<[Asset, Account, AssetBalance]>}
 */
export async function changeAssetBalance(
  store: DatabaseManager,
  assetId: Asset | string,
  wallet: AccountId32,
  amount: bigint
): Promise<[Asset, Account, AssetBalance]> {
  const [asset, account, assetBalance] = await getAssetAccountDetails(
    store,
    assetId,
    wallet
  );

  assetBalance.asset = asset;
  assetBalance.balance = assetBalance.balance || 0n + amount;
  assetBalance.account = account;
  await store.save(assetBalance);
  return [asset, account, assetBalance];
}

export async function assetCreated({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, creator, owner] = new Assets.CreatedEvent(event).params;
  const asset = new Asset();

  asset.id = assetId.toString();
  asset.creator = creator.toString();
  asset.owner = owner.toString();
  asset.status = AssetStatus.ACTIVE;
  asset.totalSupply = 0n;

  await store.save(asset);
}

export async function assetOwnerChanged({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, owner] = new Assets.OwnerChangedEvent(event).params;
  const asset = await getAssetById(assetId.toString(), store);
  asset.owner = owner.toString();
  await store.save(asset);
}

export async function assetTeamChanged({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, issuer, admin, freezer] = new Assets.TeamChangedEvent(event)
    .params;
  const asset = await getAssetById(assetId.toString(), store);

  asset.issuer = issuer.toString();
  asset.admin = admin.toString();
  asset.freezer = freezer.toString();

  await store.save(asset);
}

export async function assetFrozen({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId] = new Assets.AssetFrozenEvent(event).params;
  const asset = await getAssetById(assetId.toString(), store);

  asset.status = AssetStatus.FREEZED;

  await store.save(asset);
}

export async function assetThawed({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId] = new Assets.AssetThawedEvent(event).params;
  const asset = await getAssetById(assetId.toString(), store);

  asset.status = AssetStatus.ACTIVE;

  await store.save(asset);
}

export async function assetDestroyed({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId] = new Assets.DestroyedEvent(event).params;
  const asset = await getAssetById(assetId.toString(), store);

  asset.status = AssetStatus.DESTROYED;

  await store.save(asset);
}

export async function assetMetadata({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, name, symbol, decimals, is_frozen] =
    new Assets.MetadataSetEvent(event).params;
  const asset = await getAssetById(assetId.toString(), store);

  asset.name = String.fromCharCode(...name);
  asset.symbol = String.fromCharCode(...symbol);
  asset.decimal = decimals.toNumber();
  asset.status = is_frozen.toJSON() ? AssetStatus.FREEZED : AssetStatus.ACTIVE;

  await store.save(asset);
}

export async function assetMetadataCleared({
  store,
  event,
}: EventContext & StoreContext): Promise<void> {
  const [assetId] = new Assets.MetadataClearedEvent(event).params;
  const asset = await getAssetById(assetId.toString(), store);

  asset.name = null;
  asset.symbol = null;
  asset.decimal = null;
  // asset.status = is_frozen.toJSON() ? AssetStatus.FREEZED : AssetStatus.ACTIVE;

  await store.save(asset);
}

export async function assetIssued({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, owner, issued] = new Assets.IssuedEvent(event).params;
  const [asset] = await changeAssetBalance(
    store,
    assetId.toString(),
    owner,
    issued.toBigInt()
  );
  asset.totalSupply = asset.totalSupply || 0n + issued.toBigInt();

  await store.save(asset);

  const transfer = new Transfer();
  transfer.amount = issued.toBigInt();
  transfer.asset = asset;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.to = owner.toString();
  transfer.id = event.id;
  transfer.type = TransferType.MINT;
  transfer.success = true;
  await store.save(transfer);
}

export async function assetTransfer({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, from, to, amount] = new Assets.TransferredEvent(event).params;
  const [asset] = await changeAssetBalance(
    store,
    assetId.toString(),
    from,
    -amount.toBigInt() // decrements from sender account
  );

  await changeAssetBalance(store, asset, to, amount.toBigInt());

  const transfer = new Transfer();
  transfer.amount = amount.toBigInt();
  transfer.asset = asset;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.to = to.toString();
  transfer.from = from.toString();
  transfer.id = event.id;
  transfer.type = TransferType.REGULAR;
  transfer.success = true;
  await store.save(transfer);
}

export async function assetBalanceBurned({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, from, amount] = new Assets.BurnedEvent(event).params;
  const [asset] = await changeAssetBalance(
    store,
    assetId.toString(),
    from,
    -amount.toBigInt() // decrements from account
  );

  const transfer = new Transfer();
  transfer.amount = amount.toBigInt();
  transfer.asset = asset;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.from = from.toString();
  transfer.id = event.id;
  transfer.type = TransferType.BURN;
  transfer.success = true;
  await store.save(transfer);
}

export async function assetTransferredApproved({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, from, delegtor, to, amount] =
    new Assets.TransferredApprovedEvent(event).params;
  const [asset] = await changeAssetBalance(
    store,
    assetId.toString(),
    from,
    -amount.toBigInt() // decrements from sender account
  );

  await changeAssetBalance(store, asset, to, amount.toBigInt());

  const transfer = new Transfer();
  transfer.amount = amount.toBigInt();
  transfer.asset = asset;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.to = to.toString();
  transfer.from = from.toString();
  transfer.delegator = delegtor.toString();
  transfer.id = event.id;
  transfer.type = TransferType.DELEGATED;
  transfer.success = true;
  await store.save(transfer);
}

export async function assetAccountFrozen({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, who] = new Assets.FrozenEvent(event).params;
  const [asset, , assetBalance] = await getAssetAccountDetails(
    store,
    assetId.toString(),
    who
  );
  assetBalance.status = AssetStatus.FREEZED;
  await store.save(assetBalance);

  const transfer = new Transfer();
  transfer.amount = assetBalance.balance;
  transfer.asset = asset;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.from = who.toString();
  transfer.id = event.id;
  transfer.type = TransferType.FREEZE;
  transfer.success = true;
  await store.save(transfer);
}

export async function assetBalanceThawed({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [assetId, who] = new Assets.ThawedEvent(event).params;
  const [asset, , assetBalance] = await getAssetAccountDetails(
    store,
    assetId.toString(),
    who
  );
  assetBalance.status = AssetStatus.ACTIVE;
  await store.save(assetBalance);

  const transfer = new Transfer();
  transfer.amount = assetBalance.balance;
  transfer.asset = asset;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.from = who.toString();
  transfer.id = event.id;
  transfer.type = TransferType.THAWED;
  transfer.success = true;
  await store.save(transfer);
}

import { AccountId32 } from "@polkadot/types/interfaces";
import {
  DatabaseManager,
  EventContext,
  StoreContext,
} from "@subsquid/hydra-common";

import {
  Account,
  UniqueClass,
  UniqueInstance,
  AssetStatus,
  Transfer,
  TransferType,
  UniqueTransfer,
} from "../generated/model";
import { Uniques } from "../types/index";
import { EntityConstructor } from "../types";
import { get, getOrCreate } from "./helpers/entity-utils";

/**
 * Must get entity from database
 * @param {DatabaseManager} store
 * @param {EntityConstructor<T>} entityConstructor
 * @param {string} entityId
 *
 * @returns {Promise<T>}
 */
export async function getOrDie<T extends { id: string }>(
  store: DatabaseManager,
  entityConstructor: EntityConstructor<T>,
  entityId: string
): Promise<T> {
  const entity = await get(store, entityConstructor, entityId);
  if (!entity) {
    throw new Error(`No ${entityConstructor} found for id: ${entityId}`);
  }
  return entity;
}

/**
 * Get Account by its wallet from database
 * @param {DatabaseManager} store
 * @param {AccountId32} wallet
 *
 * @returns {Promise<T>}
 */
export async function getAccountByWallet(
  store: DatabaseManager,
  wallet: AccountId32
): Promise<Account> {
  const account = await getOrCreate(store, Account, wallet.toHex());
  if (!account.wallet) {
    account.wallet = wallet.toHuman();
    account.balance = 0n;
  }
  await store.save(account);
  return account;
}

export function getInstanceGlobalId(
  classId: string,
  instanceInnerId: string
): string {
  return `${classId}-${instanceInnerId}`;
}

export async function uniqueClassCreated({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId, creator, owner] = new Uniques.CreatedEvent(event).params;
  const uniqueClass = new UniqueClass();

  uniqueClass.id = classId.toString();
  uniqueClass.creator = creator.toString();
  uniqueClass.owner = owner.toString();
  uniqueClass.status = AssetStatus.ACTIVE;

  await store.save(uniqueClass);

  const transfer = new UniqueTransfer();
  transfer.uniqueClass = uniqueClass;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.to = owner.toString();
  transfer.id = event.id;
  transfer.type = TransferType.CREATED;
  transfer.success = true;

  await store.save(transfer);
}

export async function uniqueClassFrozen({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId] = new Uniques.ClassFrozenEvent(event).params;
  const class_ = await getOrCreate(store, UniqueClass, classId.toString());

  class_.status = AssetStatus.FREEZED;
  await store.save(class_);

  const transfer = new UniqueTransfer();
  transfer.uniqueClass = class_;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.id = event.id;
  transfer.type = TransferType.FREEZE;
  transfer.success = true;

  await store.save(transfer);
}

export async function uniqueClassThawed({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId] = new Uniques.ClassFrozenEvent(event).params;
  const class_ = await getOrCreate(store, UniqueClass, classId.toString());

  class_.status = AssetStatus.ACTIVE;
  await store.save(class_);

  const transfer = new UniqueTransfer();
  transfer.uniqueClass = class_;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.id = event.id;
  transfer.type = TransferType.THAWED;
  transfer.success = true;

  await store.save(transfer);
}

export async function uniqueClassDestroyed({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId] = new Uniques.DestroyedEvent(event).params;
  const class_ = await getOrCreate(store, UniqueClass, classId.toString());

  class_.status = AssetStatus.DESTROYED;
  await store.save(class_);

  const transfer = new UniqueTransfer();
  transfer.uniqueClass = class_;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.id = event.id;
  transfer.type = TransferType.DESTROYED;
  transfer.success = true;

  await store.save(transfer);
}

export async function uniqueInstanceIssued({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId, instanceId, owner] = new Uniques.IssuedEvent(event).params;

  const uniqueClassPromise = getOrCreate(
    store,
    UniqueClass,
    classId.toString()
  );

  const ownerAccountPromise = getAccountByWallet(store, owner);

  const [class_, ownerAccount] = await Promise.all([
    uniqueClassPromise,
    ownerAccountPromise,
  ]);

  class_.status = class_.status ?? AssetStatus.ACTIVE;
  await store.save(class_);

  const uniqueInstance = new UniqueInstance();
  const innerInstanceid = instanceId.toString();
  uniqueInstance.id = getInstanceGlobalId(class_.id, innerInstanceid);
  uniqueInstance.innerID = innerInstanceid;
  uniqueInstance.owner = ownerAccount;
  uniqueInstance.uniqueClass = class_;
  uniqueInstance.status = AssetStatus.ACTIVE;

  await store.save(uniqueInstance);

  const transfer = new UniqueTransfer();
  transfer.uniqueInstance = uniqueInstance;
  transfer.uniqueClass = class_;
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

export async function uniqueInstanceTransferred({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId, instanceId, from, to] = new Uniques.TransferredEvent(event)
    .params;
  const instanceProm = getOrDie(
    store,
    UniqueInstance,
    getInstanceGlobalId(classId.toString(), instanceId.toString())
  );
  const classProm = getOrDie(store, UniqueClass, classId.toString());
  const toAccProm = getAccountByWallet(store, to);
  const [instance, class_, toAcc] = await Promise.all([
    instanceProm,
    classProm,
    toAccProm,
  ]);

  instance.owner = toAcc;

  const transfer = new UniqueTransfer();
  transfer.uniqueInstance = instance;
  transfer.uniqueClass = class_;
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

export async function uniqueInstanceBurned({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId, instanceId, from] = new Uniques.BurnedEvent(event).params;

  const instanceProm = getOrDie(
    store,
    UniqueInstance,
    getInstanceGlobalId(classId.toString(), instanceId.toString())
  );
  const classProm = getOrDie(store, UniqueClass, classId.toString());
  const [instance, class_] = await Promise.all([instanceProm, classProm]);

  instance.status = AssetStatus.DESTROYED;
  await store.save(instance);

  const transfer = new UniqueTransfer();
  transfer.uniqueInstance = instance;
  transfer.uniqueClass = class_;
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

export async function uniqueInstanceFrozen({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId, instanceId] = new Uniques.FrozenEvent(event).params;

  const instanceProm = getOrDie(
    store,
    UniqueInstance,
    getInstanceGlobalId(classId.toString(), instanceId.toString())
  );
  const classProm = getOrDie(store, UniqueClass, classId.toString());
  const [instance, class_] = await Promise.all([instanceProm, classProm]);

  instance.status = AssetStatus.FREEZED;
  await store.save(instance);

  const transfer = new UniqueTransfer();

  transfer.uniqueInstance = instance;
  transfer.uniqueClass = class_;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.id = event.id;
  transfer.type = TransferType.FREEZE;
  transfer.success = true;
  await store.save(transfer);
}

export async function uniqueInstanceThawed({
  store,
  event,
  block,
  extrinsic,
}: EventContext & StoreContext): Promise<void> {
  const [classId, instanceId] = new Uniques.ThawedEvent(event).params;

  const instanceProm = getOrDie(
    store,
    UniqueInstance,
    getInstanceGlobalId(classId.toString(), instanceId.toString())
  );
  const classProm = getOrDie(store, UniqueClass, classId.toString());
  const [instance, class_] = await Promise.all([instanceProm, classProm]);

  instance.status = AssetStatus.ACTIVE;
  await store.save(instance);

  const transfer = new UniqueTransfer();

  transfer.uniqueInstance = instance;
  transfer.uniqueClass = class_;
  transfer.blockHash = block.hash;
  transfer.blockNum = block.height;
  transfer.createdAt = new Date(block.timestamp);
  transfer.extrinisicId = extrinsic?.id;
  transfer.id = event.id;
  transfer.type = TransferType.THAWED;
  transfer.success = true;
  await store.save(transfer);
}

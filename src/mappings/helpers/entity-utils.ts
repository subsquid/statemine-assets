import { Store } from "@subsquid/typeorm-store/lib/store";
import { EntityConstructor, WhereCondition } from "../../types";
import * as ss58 from '@subsquid/ss58'
import { EventHandlerContext } from "@subsquid/substrate-processor";
import * as storage from "../../types/storage";
import { ClassDetails, InstanceMetadata } from "../../types/v1";
import { CollectionDetails } from "../../types/v9230";
import { AssetStatus, UniqueClass, UniqueInstance } from "../../model/generated";

export async function getOrCreate<T extends { id: string }>(
  store: Store,
  entityConstructor: EntityConstructor<T>,
  id: string
): Promise<T> {
  let e = await store.get(entityConstructor, id);

  if (e == null) {
    e = new entityConstructor();
    e.id = id;
  }

  return e;
}
export async function get<T extends { id: string }>(
  store: Store,
  entityConstructor: EntityConstructor<T>,
  id: string,
): Promise<T | undefined> {
  const e = await store.get(entityConstructor, id);

  return e;
}

export function encodeId(id: Uint8Array) {
  return ss58.codec('polkadot').encode(id)
}

export function isAdressSS58(address: Uint8Array) {
  switch (address.length) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 32:
      case 33:
          return true
      default:
          return false
  }
}

export async function findClassInStorage(ctx: EventHandlerContext<Store>, classId: number) {
  let classSt = new storage.UniquesClassStorage(ctx);
  let classStorage: ClassDetails | CollectionDetails | undefined;
  if (classSt.isV1) {
    classStorage = await classSt.getAsV1(classId);
  }
  else if (classSt.isV9230) {
    classStorage = await classSt.getAsV9230(classId);
  }
  if (!classStorage) return false
  var classProm = new UniqueClass();
  classProm.id = classId.toString();
  classProm.owner = isAdressSS58(classStorage.owner) ? encodeId(classStorage.owner) : null;
  classProm.issuer = isAdressSS58(classStorage.issuer) ? encodeId(classStorage.issuer) : null;
  classProm.admin = isAdressSS58(classStorage.admin) ? encodeId(classStorage.admin) : null;
  classProm.freezer = isAdressSS58(classStorage.freezer) ? encodeId(classStorage.freezer) : null;
  classProm.totalDeposit = classStorage.totalDeposit;
  classProm.status = AssetStatus.ACTIVE;
  return classProm;
}

/* export async function findInstanceInStorage(ctx: EventHandlerContext<Store>, classId: number, instId: number) {
  let inst = new storage.UniquesInstanceMetadataOfStorage(ctx);
  let instStorage: InstanceMetadata | undefined;
  if (inst.isV1) {
    instStorage = await inst.getAsV1(classId, instId);
  }
  const class_ = await getOrCreate(ctx.store, UniqueClass, classId.toString());
  if (!instStorage || !class_) return false
  var instProm = new UniqueInstance();
  instProm.id = classId.toString();
  instProm.innerID = instId.toString();
  let owner = new storage.UniquesAccountStorage(ctx);
  if (owner.isV1) {
    instProm.owner = await owner.getAsV1();
  }
  instProm.issuer = isAdressSS58(classStorage.issuer) ? encodeId(classStorage.issuer) : null;
  instProm.admin = isAdressSS58(classStorage.admin) ? encodeId(classStorage.admin) : null;
  instProm.freezer = isAdressSS58(classStorage.freezer) ? encodeId(classStorage.freezer) : null;
  instProm.totalDeposit = classStorage.totalDeposit;
  instProm.status = AssetStatus.ACTIVE;
  return classProm;
} */
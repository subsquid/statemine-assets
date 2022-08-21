import { Store, EntityClass } from "@subsquid/typeorm-store";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import * as relations from "./relations";
import {
  Account,
  Asset,
  UniqueClass,
  UniqueInstance,
  Transfer,
  UniqueTransfer,
  AssetBalance,
} from "./model";

interface EntityWithId {
  id: string;
}

class EntitiesBuffer<Entity extends EntityWithId> {
  protected saveBuffer: Set<Entity> = new Set();

  save(entity: Entity): void {
    this.saveBuffer.add(entity);
  }

  async saveAll(db: Store): Promise<void> {
    await db.save([...this.saveBuffer]);
    this.saveBuffer.clear();
  }

}

class EntitiesCache<
  Entity extends EntityWithId
> extends EntitiesBuffer<Entity> {
  protected cache: Map<string, Entity> = new Map();

  protected addCache(entity: Entity): void {
    this.cache.set(entity.id, entity);
  }

  save(entity: Entity): void {
    this.saveBuffer.add(entity);
    this.addCache(entity);
  }

  async get(
    db: Store,
    entity: EntityClass<Entity>,
    id: string,
    relations?: FindOptionsRelations<Entity>,
    dieIfNull?: boolean
  ): Promise<Entity | undefined> {
    let item = this.cache.get(id);
    if (!item) {
      item = await db.get(entity, {
        where: { id } as FindOptionsWhere<Entity>,
        // relations,
      });
    }
    if (item) {
      this.addCache(item);
    } else if (dieIfNull) {
      throw new Error("Not null assertion");
    }
    return item;
  }

  async saveAll(db: Store, clear?: boolean): Promise<void> {
    await db.save([...this.saveBuffer]);
    this.saveBuffer.clear();
    if (clear) {
      this.cache.clear();
    }
  }
}

export const transfers = new EntitiesBuffer<Transfer>();
export const accounts = new EntitiesCache<Account>();
export const assets = new EntitiesCache<Asset>();
export const assetBalances = new EntitiesCache<AssetBalance>();
export const uniqueTransfers = new EntitiesBuffer<UniqueTransfer>();
export const uniqueClasses = new EntitiesCache<UniqueClass>();
export const uniqueInstances = new EntitiesCache<UniqueInstance>();


export async function saveAll(db: Store): Promise<void> {
    await accounts.saveAll(db, true)
    await assetBalances.saveAll(db, true)
    await assets.saveAll(db, true)
    await uniqueInstances.saveAll(db, true);
    await uniqueClasses.saveAll(db, true);
    await uniqueTransfers.saveAll(db);
    await transfers.saveAll(db);
}
import { DatabaseManager } from "@subsquid/hydra-common";
import { EntityConstructor, WhereCondition } from "../../types";

export async function getOrCreate<T extends { id: string }>(
  store: DatabaseManager,
  entityConstructor: EntityConstructor<T>,
  id: string
): Promise<T> {
  let e = await store.get(entityConstructor, {
    where: { id },
  });

  if (e == null) {
    e = new entityConstructor();
    e.id = id;
    //console.log(`Created ${entityConstructor}`)
  }

  return e;
}
export async function get<T extends { id: string }>(
  store: DatabaseManager,
  entityConstructor: EntityConstructor<T>,
  id: string,
  where?: WhereCondition
): Promise<T | undefined> {
  const e = await store.get(entityConstructor, {
    where: where ? where : { id },
  });

  return e;
}

import { Store } from "@subsquid/typeorm-store/lib/store";
import { EntityConstructor, WhereCondition } from "../../types";

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

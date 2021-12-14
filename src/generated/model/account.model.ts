import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "../marshal"
import {AssetBalance} from "./assetBalance.model"
import {UniqueInstance} from "./uniqueInstance.model"
import {HistoricalBalance} from "./historicalBalance.model"

@Entity_()
export class Account {
  constructor(props?: Partial<Account>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  wallet!: string

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  balance!: bigint

  @OneToMany_(() => AssetBalance, e => e.account)
  assets!: AssetBalance[]

  @OneToMany_(() => UniqueInstance, e => e.owner)
  uniqueInstances!: UniqueInstance[]

  @OneToMany_(() => HistoricalBalance, e => e.account)
  historicalBalances!: HistoricalBalance[]
}

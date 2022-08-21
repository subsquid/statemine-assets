import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {AssetStatus} from "./_assetStatus"
import {Transfer} from "./transfer.model"
import {AssetBalance} from "./assetBalance.model"

@Entity_()
export class Asset {
  constructor(props?: Partial<Asset>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: true})
  name!: string | undefined | null

  @Column_("text", {nullable: true})
  symbol!: string | undefined | null

  @Column_("text", {nullable: true})
  freezer!: string | undefined | null

  @Column_("int4", {nullable: true})
  decimal!: number | undefined | null

  @Column_("text", {nullable: false})
  owner!: string

  @Column_("text", {nullable: true})
  admin!: string | undefined | null

  @Column_("text", {nullable: true})
  issuer!: string | undefined | null

  @Column_("text", {nullable: true})
  creator!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  minBalance!: bigint | undefined | null

  @Column_("varchar", {length: 9, nullable: false})
  status!: AssetStatus

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  totalSupply!: bigint | undefined | null

  @OneToMany_(() => Transfer, e => e.asset)
  transfers!: Transfer[]

  @OneToMany_(() => AssetBalance, e => e.asset)
  assetBalances!: AssetBalance[]
}

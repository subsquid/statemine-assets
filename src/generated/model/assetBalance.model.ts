import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "../marshal"
import {Account} from "./account.model"
import {AssetStatus} from "./assetStatus"
import {Asset} from "./asset.model"

@Entity_()
export class AssetBalance {
  constructor(props?: Partial<AssetBalance>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: false})
  account!: Account

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  balance!: bigint

  @Column_("varchar", {length: 9, nullable: false})
  status!: AssetStatus

  @Index_()
  @ManyToOne_(() => Asset, {nullable: false})
  asset!: Asset
}

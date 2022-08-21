import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {UniqueClass} from "./uniqueClass.model"
import {Account} from "./account.model"
import {AssetStatus} from "./_assetStatus"
import {UniqueTransfer} from "./uniqueTransfer.model"
import {Attribute} from "./_attribute"

@Entity_()
export class UniqueInstance {
  constructor(props?: Partial<UniqueInstance>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  innerID!: string

  @Index_()
  @ManyToOne_(() => UniqueClass, {nullable: true})
  uniqueClass!: UniqueClass

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  owner!: Account

  @Column_("varchar", {length: 9, nullable: false})
  status!: AssetStatus

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  deposit!: bigint | undefined | null

  @OneToMany_(() => UniqueTransfer, e => e.uniqueInstance)
  transfers!: UniqueTransfer[]

  @Column_("text", {nullable: true})
  metadata!: string | undefined | null

  @Column_("jsonb", {transformer: {to: obj => obj == null ? undefined : obj.map((val: any) => val.toJSON()), from: obj => obj == null ? undefined : marshal.fromList(obj, val => new Attribute(undefined, marshal.nonNull(val)))}, nullable: true})
  attributes!: (Attribute)[] | undefined | null
}

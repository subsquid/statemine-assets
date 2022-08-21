import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {UniqueClass} from "./uniqueClass.model"
import {UniqueInstance} from "./uniqueInstance.model"
import {TransferType} from "./_transferType"

@Entity_()
export class UniqueTransfer {
  constructor(props?: Partial<UniqueTransfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: true})
  to!: string | undefined | null

  @Column_("text", {nullable: true})
  from!: string | undefined | null

  @Column_("text", {nullable: true})
  delegator!: string | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
  fee!: bigint | undefined | null

  @Index_()
  @ManyToOne_(() => UniqueClass, {nullable: true})
  uniqueClass!: UniqueClass | undefined | null

  @Index_()
  @ManyToOne_(() => UniqueInstance, {nullable: true})
  uniqueInstance!: UniqueInstance | undefined | null

  @Column_("varchar", {length: 23, nullable: false})
  type!: TransferType

  @Column_("text", {nullable: true})
  extrinisicId!: string | undefined | null

  @Column_("bool", {nullable: false})
  success!: boolean

  @Column_("timestamp with time zone", {nullable: false})
  createdAt!: Date

  @Column_("text", {nullable: false})
  blockHash!: string

  @Column_("int4", {nullable: false})
  blockNum!: number
}

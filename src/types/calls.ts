import assert from 'assert'
import {Chain, ChainContext, CallContext, Call, Result} from './support'
import * as v1 from './v1'
import * as v504 from './v504'

export class AssetsCreateCall {
  private readonly _chain: Chain
  private readonly call: Call

  constructor(ctx: CallContext)
  constructor(ctx: ChainContext, call: Call)
  constructor(ctx: CallContext, call?: Call) {
    call = call || ctx.call
    assert(call.name === 'Assets.create')
    this._chain = ctx._chain
    this.call = call
  }

  /**
   *  Issue a new class of fungible assets from a public origin.
   * 
   *  This new asset class has no assets initially and its owner is the origin.
   * 
   *  The origin must be Signed and the sender must have sufficient funds free.
   * 
   *  Funds of sender are reserved by `AssetDeposit`.
   * 
   *  Parameters:
   *  - `id`: The identifier of the new asset. This must not be currently in use to identify
   *  an existing asset.
   *  - `admin`: The admin of this class of assets. The admin is the initial address of each
   *  member of the asset class's admin team.
   *  - `min_balance`: The minimum balance of this new asset that any single account must
   *  have. If an account's balance is reduced below this, then it collapses to zero.
   * 
   *  Emits `Created` event when successful.
   * 
   *  Weight: `O(1)`
   */
  get isV1(): boolean {
    return this._chain.getCallHash('Assets.create') === '166a4414164ed19607499d930895acc0be2caf13ab24c68a80a8ba4c8a14eec4'
  }

  /**
   *  Issue a new class of fungible assets from a public origin.
   * 
   *  This new asset class has no assets initially and its owner is the origin.
   * 
   *  The origin must be Signed and the sender must have sufficient funds free.
   * 
   *  Funds of sender are reserved by `AssetDeposit`.
   * 
   *  Parameters:
   *  - `id`: The identifier of the new asset. This must not be currently in use to identify
   *  an existing asset.
   *  - `admin`: The admin of this class of assets. The admin is the initial address of each
   *  member of the asset class's admin team.
   *  - `min_balance`: The minimum balance of this new asset that any single account must
   *  have. If an account's balance is reduced below this, then it collapses to zero.
   * 
   *  Emits `Created` event when successful.
   * 
   *  Weight: `O(1)`
   */
  get asV1(): {id: number, admin: v1.LookupSource, minBalance: bigint} {
    assert(this.isV1)
    return this._chain.decodeCall(this.call)
  }

  /**
   * Issue a new class of fungible assets from a public origin.
   * 
   * This new asset class has no assets initially and its owner is the origin.
   * 
   * The origin must be Signed and the sender must have sufficient funds free.
   * 
   * Funds of sender are reserved by `AssetDeposit`.
   * 
   * Parameters:
   * - `id`: The identifier of the new asset. This must not be currently in use to identify
   * an existing asset.
   * - `admin`: The admin of this class of assets. The admin is the initial address of each
   * member of the asset class's admin team.
   * - `min_balance`: The minimum balance of this new asset that any single account must
   * have. If an account's balance is reduced below this, then it collapses to zero.
   * 
   * Emits `Created` event when successful.
   * 
   * Weight: `O(1)`
   */
  get isV504(): boolean {
    return this._chain.getCallHash('Assets.create') === 'ca0409e022ec3c668d76f1f4814f288ffed58f980abfd6a87d4e15686ab290f0'
  }

  /**
   * Issue a new class of fungible assets from a public origin.
   * 
   * This new asset class has no assets initially and its owner is the origin.
   * 
   * The origin must be Signed and the sender must have sufficient funds free.
   * 
   * Funds of sender are reserved by `AssetDeposit`.
   * 
   * Parameters:
   * - `id`: The identifier of the new asset. This must not be currently in use to identify
   * an existing asset.
   * - `admin`: The admin of this class of assets. The admin is the initial address of each
   * member of the asset class's admin team.
   * - `min_balance`: The minimum balance of this new asset that any single account must
   * have. If an account's balance is reduced below this, then it collapses to zero.
   * 
   * Emits `Created` event when successful.
   * 
   * Weight: `O(1)`
   */
  get asV504(): {id: number, admin: v504.MultiAddress, minBalance: bigint} {
    assert(this.isV504)
    return this._chain.decodeCall(this.call)
  }
}

export class TimestampSetCall {
  private readonly _chain: Chain
  private readonly call: Call

  constructor(ctx: CallContext)
  constructor(ctx: ChainContext, call: Call)
  constructor(ctx: CallContext, call?: Call) {
    call = call || ctx.call
    assert(call.name === 'Timestamp.set')
    this._chain = ctx._chain
    this.call = call
  }

  /**
   *  Set the current time.
   * 
   *  This call should be invoked exactly once per block. It will panic at the finalization
   *  phase, if this call hasn't been invoked by that time.
   * 
   *  The timestamp should be greater than the previous one by the amount specified by
   *  `MinimumPeriod`.
   * 
   *  The dispatch origin for this call must be `Inherent`.
   * 
   *  # <weight>
   *  - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
   *  - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in `on_finalize`)
   *  - 1 event handler `on_timestamp_set`. Must be `O(1)`.
   *  # </weight>
   */
  get isV1(): boolean {
    return this._chain.getCallHash('Timestamp.set') === '6a8b8ba2be107f0853b674eec0026cc440b314db44d0e2c59b36e353355aed14'
  }

  /**
   *  Set the current time.
   * 
   *  This call should be invoked exactly once per block. It will panic at the finalization
   *  phase, if this call hasn't been invoked by that time.
   * 
   *  The timestamp should be greater than the previous one by the amount specified by
   *  `MinimumPeriod`.
   * 
   *  The dispatch origin for this call must be `Inherent`.
   * 
   *  # <weight>
   *  - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
   *  - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in `on_finalize`)
   *  - 1 event handler `on_timestamp_set`. Must be `O(1)`.
   *  # </weight>
   */
  get asV1(): {now: bigint} {
    assert(this.isV1)
    return this._chain.decodeCall(this.call)
  }
}

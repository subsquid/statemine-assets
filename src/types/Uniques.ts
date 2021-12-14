import {create} from './_registry'
import {AccountId32} from '@polkadot/types/interfaces'
import {u32} from '@polkadot/types'
import {SubstrateEvent} from '@subsquid/hydra-common'

export namespace Uniques {
  /**
   * Some asset class was created. \[asset_id, creator, owner\]
   */
  export class CreatedEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32, AccountId32, AccountId32] {
      return [
        create('u32', this.event.params[0].value), 
        create('AccountId32', this.event.params[1].value), 
        create('AccountId32', this.event.params[2].value)
      ]
    }
  }

  /**
   * Some asset instance issued. \[class, instance, owner\]
   */
  export class IssuedEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32, u32, AccountId32] {
      return [
        create('u32', this.event.params[0].value),
        create('u32', this.event.params[1].value),
        create('AccountId32', this.event.params[2].value)
      ]
    }
  }

  /**
   * Some asset instance were transferred. \[class_id, instnace_id, from, to\]
   */
  export class TransferredEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32, u32, AccountId32, AccountId32] {
      return [
        create('u32', this.event.params[0].value), 
        create('u32', this.event.params[1].value), 
        create('AccountId32', this.event.params[2].value), 
        create('AccountId32', this.event.params[3].value)
      ]
    }
  }

  /**
   * Some asset instance was destroyed. \[class_id, instance_id, owner\]
   */
  export class BurnedEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32, u32, AccountId32] {
      return [
        create('u32', this.event.params[0].value), 
        create('u32', this.event.params[1].value), 
        create('AccountId32', this.event.params[2].value)]
    }
  }


  /**
   * Some asset `instance` was frozen. \[class, instance\]
   */
  export class FrozenEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32, u32] {
      return [
        create('u32', this.event.params[0].value), 
        create('u32', this.event.params[1].value)
      ]
    }
  }

  /**
   * Some instace was thawed. \[class, instance\]
   */
  export class ThawedEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32, u32] {
      return [
        create('u32', this.event.params[0].value), 
        create('u32', this.event.params[1].value)
      ]
    }
  }

  /**
   * Some asset class `class_id` was frozen. \[class_id\]
   */
  export class ClassFrozenEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32] {
      return [create('u32', this.event.params[0].value)]
    }
  }

  /**
   * Some asset class `class_id` was thawed. \[class_id\]
   */
  export class ClassThawedEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32] {
      return [create('u32', this.event.params[0].value)]
    }
  }

  /**
   * An asset class was destroyed.
   */
  export class DestroyedEvent {
    constructor(private event: SubstrateEvent) {
      //console.log(this)
    }

    get params(): [u32] {
      return [create('u32', this.event.params[0].value)]
    }
  }
}

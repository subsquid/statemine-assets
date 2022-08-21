import assert from "assert"
import * as marshal from "./marshal"

export class Attribute {
  private _key!: string | undefined | null
  private _value!: string

  constructor(props?: Partial<Omit<Attribute, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._key = json.key == null ? undefined : marshal.string.fromJSON(json.key)
      this._value = marshal.string.fromJSON(json.value)
    }
  }

  get key(): string | undefined | null {
    return this._key
  }

  set key(value: string | undefined | null) {
    this._key = value
  }

  get value(): string {
    assert(this._value != null, 'uninitialized access')
    return this._value
  }

  set value(value: string) {
    this._value = value
  }

  toJSON(): object {
    return {
      key: this.key,
      value: this.value,
    }
  }
}

import type {Result} from './support'

export type LookupSource = LookupSource_Id | LookupSource_Index | LookupSource_Raw | LookupSource_Address32 | LookupSource_Address20

export interface LookupSource_Id {
  __kind: 'Id'
  value: Uint8Array
}

export interface LookupSource_Index {
  __kind: 'Index'
  value: number
}

export interface LookupSource_Raw {
  __kind: 'Raw'
  value: Uint8Array
}

export interface LookupSource_Address32 {
  __kind: 'Address32'
  value: Uint8Array
}

export interface LookupSource_Address20 {
  __kind: 'Address20'
  value: Uint8Array
}

/* This store contains all data that are related to aims and their connections. 
 * It is used by the sidebar and the map */

import { defineStore } from 'pinia'
import { useWeb3Connection } from './web3-connection'

import Effort from '../types/effort'

import ColorHash from 'color-hash'; 

import * as vec2 from '../vec2'

const colorHash = new ColorHash({ lightness: 0.35, saturation: 0.5 }); 

export class AimOrigin {
  title?: string
  detailsCid?: string
  shares?: number
  state?: string 
  effort?: Effort
}

export class Aim {
  title: string = ""
  detailsCid: string = "" 
  state: string=""
  effort = new Effort('s', 0)
  shares = 0
  importance = 100

  pos = vec2.create()

  color: string
  
  published = false

  flowsFrom: { [aimId: string]: Flow } = {}
  flowsInto: { [aimId: string]: Flow } = {}

  origin = new AimOrigin()

  pendingTransactions = false

  constructor(
    public id: string, 
    public owner: string, 
    public subLevel: number
  ) {
    let color = colorHash.rgb(id); 
    color[0] *= 1.3
    color[2] *= 1.6
    this.color = `rgb(${color.join(',')})`
  }
}

export class FlowOrigin {
  detailsCid?: string
  share?: number
}

export class Flow {
  reasonCid: string = ""
  share = 0

  origin = new FlowOrigin()

  pendingTransactions = false

  published = false

  dx = 0
  dy = 0

  constructor(
    public from: Aim,
    public into: Aim 
  ) {}
}

function idToBigInt(hex: string) {
  return BigInt('0x' + hex) 
}


export const useAimNetwork = defineStore('aim-network', {
  state() {
    return {
      aims: {} as {[id: string]: Aim}, 
      flows: {} as {[from: string]: {[into: string]: Flow}}, 
      home: undefined as string | undefined,
      selectedAim: undefined as Aim | undefined,
      selectedFlow: undefined as Flow | undefined, 
    }
  }, 
  actions: {
    async loadHome() {
      console.log("loading home node") 
      let web3 = useWeb3Connection()
      if(web3.contract !== undefined) {
        console.log(web3.contract) 
        const homeId = 0 // await web3.contract.homes(web3.address)
        if(homeId == 0) {
          this.home == undefined
        } else {
          this.home = homeId
          this.loadAim(homeId) 
        }
      }
    }, 
    async setHome(aimId: string) {
      let web3 = useWeb3Connection()
      if(web3.contract) {
        const aimIdBigId = BigInt('0x' + aimId)
        const data = await web3.contract.setHomeAim(aimIdBigId)
        console.log("called setHome, received: ", data) 
      }
    }, 

    // create and load aims
    createAndSelectAim(modifyAimCb?: (aim: Aim) => void) {
      let owner = useWeb3Connection().address
      if(owner) {
        let bytes = new Uint8Array(16)
        crypto.getRandomValues(bytes)
        let aimId = Array.from(bytes).map(n => n.toString(16)).join('')
        let aimRaw = new Aim(aimId, owner, 0)
        if(modifyAimCb) {
          modifyAimCb(aimRaw) 
        }
        this.aims[aimId] = aimRaw
        const aim = this.aims[aimId]
        this.selectedAim = aim
      }
    }, 
    async createAimOnChain(_aimId: string) {
        if(this.home == undefined) {
          // TBD this.setHome(idToBigInt(aimId))
        }
    }, 
    async loadAim(aimId: BigInt) {
      console.log("load aim", aimId)  
    }, 

    // edit and remove aims
    async commitAimChanges(aim: Aim) {
      Object.getOwnPropertyNames(aim.origin).forEach((name: string) => {
        if((aim.origin as any)[name] !== undefined) {
          console.log("chaning property", name)
        }
      })
      aim.origin = new AimOrigin()
    }, 
    resetAimChanges(aim: Aim) {
      Object.entries(aim.origin).forEach(([key, value]) => {
        if(value !== undefined) {
          (aim as any)[key] = value
        }
      })
      aim.origin = new AimOrigin()
    }, 
    removeAim(aim: Aim) {
      if(this.selectedAim == aim) {
        this.selectedAim = undefined
      } 
      delete this.aims[aim.id]
    },

    // create and load flows
    createAndSelectFlow(from: Aim, into: Aim) {
      if(from !== into) {
        let owner = useWeb3Connection().address

        if(owner == into.owner) {
          let flowRaw = new Flow(from, into) 
          flowRaw.share = 0.1
          const bucket = this.flows[from.id] 
          if(bucket) {
            bucket[into.id] = flowRaw
          } else {
            this.flows[from.id] = { 
              [into.id]: flowRaw
            }
          }

          // is this reactive? Possible pitfall: object gets reactive when added to the store, not before that. It might as well work - let's observe
          const flow = this.flows[from.id][into.id]

          from.flowsInto[into.id] = flow 
          into.flowsFrom[from.id] = flow
          
          this.selectFlow(flow)
        }
      }
    }, 
    //TBD: createFlowOnChain()
    

    // edit and remove flows
    commitFlowChanges() {
    }, 
    resetFlowChanges() {
    }, 
    removeFlow(flow: Flow) {
      if(this.selectedFlow == flow) {
        this.selectedFlow = undefined
      }
    },

    // selection
    selectFlow(flow: Flow) {
      this.selectedAim = undefined
      this.selectedFlow = flow
    }, 
    selectAim(aim: Aim) {
      this.selectedFlow = undefined
      this.selectedAim = aim
    },
    deselect() {
      this.selectedAim = undefined
      this.selectedFlow = undefined
    },
  }, 
})

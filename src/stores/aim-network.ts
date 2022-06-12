/* This store contains all data that are related to aims and their connections. 
 * It is used by the sidebar and the map */

import { defineStore } from 'pinia'
import { useWeb3Connection } from './web3-connection'

import { ethers } from 'ethers'

import Effort from '../types/effort'

import * as vec2 from '../vec2'

function randomAimColor() {
  let r,g,b,l:number | undefined
  while(!l || l < 0) {
    r = Math.random() 
    g = Math.random()
    b = Math.random()
    l = Math.sqrt(r * r + g * g + b * b)
    if(l > 0) {
      return [r,g,b].map(c => Math.floor((0.05 + 0.8 * c / l!) * 255 ))
    }
  }
}

export class AimOrigin {
  title?: string
  detailsCid?: string
  shares?: number
  state?: string 
  effort?: Effort
}

export class Aim {
  static nextAimId = 0
  id = Aim.nextAimId++ // auto increment xD

  address?: string
  title: string = ""
  description: string = "" 
  state: string=""
  effort = new Effort('s', 0)
  shares = 0
  importance = Math.random() * 100 + 100

  loadLevel = 0 // 0 means: don't load neighbors

  tokenName = ""
  tokenSymbol = ""

  pos = vec2.create()

  rgb: [number, number, number] = [0, 0, 0]
  color = "000000"
  
  flowsFrom: { [aimId: string]: Flow } = {}
  flowsInto: { [aimId: string]: Flow } = {}

  loopWeight = 0x7000; // half of uint16

  origin = new AimOrigin()

  pendingTransactions = false

  static Permissions = {
    FULL: 0xff, 
    EDIT: 0x01, 
    NETWORK: 0x02,
    MANAGE: 0x04, 
    //...
    OWNER: 0x80, 
  }
  permissions = 0

  constructor() {
  }

  setColor(rgb: [number, number, number]) {
    this.color = '#' + rgb.map(c => ("0" + Math.floor(c).toString(16)).slice(-2)).join('') 
    this.rgb = rgb
  }
}

export class FlowOrigin {
  detailsCid?: string
  weigth?: number
}

export class Flow {
  explanation: string = ""
  weight = 0x7000;

  share = 0; // share get's calculated based on all outgoing weights

  origin = new FlowOrigin()

  pendingTransactions = false

  published = false

  dx = 0
  dy = 0

  constructor(
    public from: Aim,
    public into: Aim 
  ) {}

  setWeight(v: number) {
    v = Math.max(Math.min(0xffff, v), 0) // clamp
    console.log(v)
    this.weight = v
    let flows = this.into.flowsFrom
    let totalWeight = this.from.loopWeight
    for(let key in flows) {
      totalWeight += flows[key].weight
    }
    for(let key in flows) {
      flows[key].share = flows[key].weight / totalWeight
    }
  }
}

export const useAimNetwork = defineStore('aim-network', {
  state() {
    return {
      aims: {} as {[id: number]: Aim}, 
      flows: {} as {[from: string]: {[into: string]: Flow}}, 
      selectedAim: undefined as Aim | undefined,
      selectedFlow: undefined as Flow | undefined, 
    }
  }, 
  actions: {
    async loadHome() {
      let summitsContract = useWeb3Connection().getSummitsContract()
      if(summitsContract) {
        const baseAimAddr = await summitsContract.baseAim()
        this.loadAim(baseAimAddr) 
      }
    }, 
    async setHome(aimId: string) { // there will be no home to be set no more
      let summitsContract = useWeb3Connection().getSummitsContract()
      if(summitsContract) {
        const aimIdBigId = BigInt('0x' + aimId)
        const data = await summitsContract.setHomeAim(aimIdBigId)
      }
    }, 
    // create and load aims
    createAndSelectAim(modifyAimCb?: (aim: Aim) => void) {
      this.selectedAim = this.createAim(aim => {
        aim.permissions = Aim.Permissions.FULL
        aim.setColor(randomAimColor())

        modifyAimCb && modifyAimCb(aim)
      })
    }, 
    createAim(modifyAimCb?: (aim: Aim) => void) {
      let rawAim = new Aim()
      if(modifyAimCb) {
        modifyAimCb(rawAim) 
      }
      this.aims[rawAim.id] = rawAim // only now it becomes reactive
      return this.aims[rawAim.id] 
    },
    async publishAimOnChain(aim: Aim) {
      let summitsContract = useWeb3Connection().getSummitsContract()
      if(summitsContract) {
        let address = summitsContract.createAim(
          aim.title, 
          aim.description, 
          aim.effort,
          aim.tokenName,
          aim.tokenSymbol
        )
        if(address) {
          aim.address = address
        }
      }
    }, 
    async loadAim(aimAddr: string) {
      const w3 = useWeb3Connection()
      let aimContract = w3.getAimContract(aimAddr) 
      let dataPromises = []
      dataPromises.push(aimContract.title())
      dataPromises.push(aimContract.color())
      Promise.all(dataPromises).then(([title, color]) => {
        this.createAim(aim => {
          aim.title = title 
          aim.setColor(Array.from(ethers.utils.arrayify(color)) as [number, number, number])
        })
      })
    }, 

    // edit and remove aims
    async commitAimChanges(aim: Aim) {
      Object.getOwnPropertyNames(aim.origin).forEach((name: string) => {
        if((aim.origin as any)[name] !== undefined) {
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
      for(let fromId in aim.flowsFrom) {
        this.removeFlow(aim.flowsFrom[fromId]) 
      }
      for(let intoId in aim.flowsInto) {
        this.removeFlow(aim.flowsInto[intoId]) 
      }
      if(this.selectedAim == aim) {
        this.selectedAim = undefined
      } 
      delete this.aims[aim.id]
    },

    // create and load flows
    createAndSelectFlow(from: Aim, into: Aim) {
      if(from !== into) {
        if((Aim.Permissions.NETWORK & into.permissions) > 0) {
          let rawFlow = new Flow(from, into) 
          rawFlow.weight = 0x7fff;
          const bucket = this.flows[from.id] 
          if(bucket) {
            bucket[into.id] = rawFlow
          } else {
            this.flows[from.id] = { 
              [into.id]: rawFlow
            }
          }

          // is this reactive? Possible pitfall: object gets reactive when added to the store, not before that. It might as well work - let's observe
          const flow = this.flows[from.id][into.id]

          from.flowsInto[into.id] = flow 
          into.flowsFrom[from.id] = flow
          flow.setWeight(0x7fff)
          this.selectFlow(flow)
        }
      }
    }, 
    //TBD: createFlowOnChain()

    // edit and remove flows
    commitFlowChanges(_flow: Flow) {
    }, 
    resetFlowChanges(_flow: Flow) {
    }, 
    removeFlow(flow: Flow) {
      if(this.selectedFlow == flow) {
        this.selectedFlow = undefined
      }
      delete flow.from.flowsInto[flow.into.id]
      delete flow.into.flowsFrom[flow.from.id]
      delete this.flows[flow.from.id][flow.into.id]
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

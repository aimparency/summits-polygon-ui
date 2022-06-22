/* This store contains all data that are related to aims and their connections. 
 * It is used by the sidebar and the map */

import { defineStore } from 'pinia'
import { useWeb3Connection } from './web3-connection'

import { BigNumber, ethers } from 'ethers'

import { useMap } from './map'

import * as vec2 from '../vec2'
import { toRaw } from 'vue'

function randomAimColor() {
  let r,g,b,l:number | undefined
  while(true) {
    r = Math.random() 
    g = Math.random()
    b = Math.random()
    l = Math.sqrt(r * r + g * g + b * b)
    if(l > 0) {
      return [r,g,b].map(c => Math.floor((0.05 + 0.8 * c / l!) * 255 )) as [number, number, number]
    }
  }
}

function clampLoopWeight(v: number) {
  return Math.max(Math.min(0xffff, v), 0)
}

export class AimOrigin {
  title?: string
  description?: string
  tokens?: bigint 
  state?: string 
  effort?: number 
}

export class Aim {
  static nextAimId = 0
  id = Aim.nextAimId++ // auto increment xD

  address?: string
  title: string = ""
  description: string = "" 
  state: string=""
  effort: number = 0 
  rgb: [number, number, number] = [0, 0, 0]

  tokens = 0n
  totalSupply = 0n
  tokensOnChain = 0n

  tokenName = ""
  tokenSymbol = ""

  pos = vec2.create()
  r = 0
  color = "000000"

  loadLevel = 0 // 0 means: don't load neighbors
  
  flowsFrom: { [aimId: string]: Flow } = {}
  flowsInto: { [aimId: string]: Flow } = {}

  loopWeight = 0x8000; // half of uint16

  origin = new AimOrigin()

  pendingTransactions = 0

  static Permissions: {[name: string]: number} = {
    ALL: 0xff, 
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

  setLoopWeight(v: number) {
    this.loopWeight = clampLoopWeight(v) 
    this.recalcWeights()
  }

  recalcWeights() {
    let flows = this.flowsFrom
    let totalWeight = this.loopWeight
    for(let key in flows) {
      totalWeight += flows[key].weight
    }
    for(let key in flows) {
      flows[key].share = flows[key].weight / totalWeight
    }
  }

  setTokens(v: bigint) {
    this.tokens = v
    let localSupply: bigint = this.totalSupply - this.tokensOnChain + this.tokens
    this.r = Math.sqrt(Number((localSupply / 1000000n).toString())) // here, this is the only factor that counts
  }
}

export class FlowOrigin {
  explanation?: string
  weigth?: number
}

export class Flow {
  explanation: string = ""
  weight = 0x7000;

  share = 0; // share get's calculated based on all outgoing weights

  origin = new FlowOrigin()

  pendingTransactions = 0

  published = false

  dx = 0
  dy = 0

  constructor(
    public from: Aim,
    public into: Aim 
  ) {}

  setWeight(v: number) {
    this.weight = clampLoopWeight(v) 
    this.into.recalcWeights()
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
        let home = await this.loadAim(baseAimAddr) 
        const map = useMap()

        // Gleichung: 
        // 100 = scale * home.r
        // scale = 100 / home.r
        map.scale = 200 / home.r

        // test transaction
        // await summitsContract.test() // test
      }
    }, 
    // create and load aims
    createAndSelectAim(modifyAimCb?: (aim: Aim) => void) {
      this.selectedAim = this.createAim(aim => {
        aim.permissions = Aim.Permissions.ALL
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
      console.log("publishing on chain") 
      let summitsContract = useWeb3Connection().getSummitsContract()
      let price = aim.tokens * aim.tokens
      if(summitsContract) {
        console.log(aim.title)
        console.log(aim.description) 
        console.log(aim.effort)
        console.log(aim.rgb) 
        console.log(aim.tokenName)
        console.log(aim.tokenSymbol) 
        console.log(aim.tokens)
        console.log(summitsContract) 
        aim.pendingTransactions += 1
        let tx = await summitsContract.createAim(
          aim.title, 
          aim.description, 
          Math.trunc(aim.effort), 
          toRaw(aim.rgb), 
          aim.tokenName,
          aim.tokenSymbol, 
          aim.tokens, 
          {
            value: price, 
            gasPrice: 50000000000, 
            gasLimit: 10000000 
          }
        )
        console.log("created aim") 
        let rc = await tx.wait()
        let events: any = rc.events.find((e: any) => e.event === 'AimCreation') 
        // let [from, to, value] = events.args
        console.log("AimCreated event args:", events.args) 
        aim.pendingTransactions -= 1
        // if(address) {
        //   aim.address = address
        //   console.log("created aim on chain; received address", address)  
        // }
      }
    }, 
    async loadAim(aimAddr: string) {
      const w3 = useWeb3Connection()
      let aimContract = w3.getAimContract(aimAddr) 
      let dataPromises = []
      dataPromises.push(aimContract.title())
      dataPromises.push(aimContract.color())
      dataPromises.push(aimContract.symbol())
      dataPromises.push(aimContract.name())
      dataPromises.push(aimContract.description())
      dataPromises.push(aimContract.totalSupply())
      dataPromises.push(aimContract.getPermissions())
      dataPromises.push(aimContract.getInvestment())
      return await Promise.all(dataPromises).then(([
        title, color, symbol, name, description, supply, permissions, tokens
      ]) => {
        return this.createAim(aim => {
          aim.address = aimAddr
          aim.title = title 
          aim.description = description
          aim.setColor(Array.from(ethers.utils.arrayify(color)) as [number, number, number])
          aim.tokenName = name 
          aim.tokenSymbol = symbol
          aim.permissions = permissions
          const t = BigNumber.from(tokens).toBigInt()
          aim.totalSupply = BigNumber.from(supply).toBigInt()
          aim.tokensOnChain = t
          aim.setTokens(t) 
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

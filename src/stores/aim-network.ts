/* This store contains all data that are related to aims and their connections. 
 * It is used by the sidebar and the map */

import { defineStore } from 'pinia'
import { useWeb3Connection } from './web3-connection'

import { BigNumber, ethers } from 'ethers'

import { useMap } from './map'

import * as vec2 from '../vec2'
import { markRaw, toRaw } from 'vue'

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

export type Rgb = [number, number, number]

export class AimOrigin {
  title?: string
  description?: string
  color?: Rgb
  status?: string 
  effort?: number 
}

export class Aim {
  static nextAimId = 0
  id = Aim.nextAimId++ // auto increment xD

  address?: string
  owner?: string
  pinned: boolean = false

  title: string = ""
  description: string = "" 
  status: string=""
  effort: number = 0 
  rgb: [number, number, number] = [0, 0, 0]

  tokens = 0n
  tokensOnChain = 0n
  tokenSupply = 0n

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
    let localSupply: bigint = this.tokenSupply - this.tokensOnChain + this.tokens
    this.r = Math.sqrt(Number((localSupply).toString())) / 1000 
  }

  clearOrigin() {
    this.origin = new AimOrigin()
  }

  updateTokens(v: bigint) {
    this.setTokens(v) 
  }

  updateState(v: string) {
    if(v === this.origin.status) { 
      this.origin.status = undefined
    } else if(this.origin.status === undefined) {
      this.origin.status = this.status
    }
    this.status = v
  }

  updateTitle(v: string) {
    if(v === this.origin.title) { 
      this.origin.title = undefined
    } else if(this.origin.title === undefined) {
      this.origin.title = this.title
    }
    this.title = v
  }

  updateDescription(v: string) {
    if(v === this.origin.description) { 
      this.origin.description = undefined
    } else if(this.origin.description === undefined) {
      this.origin.description = this.description
    }
    this.description = v
  }

  updateEffort(v: number) {
    if(v === this.origin.effort) { 
      this.origin.effort = undefined
    } else if(this.origin.effort === undefined) {
      this.origin.effort = this.effort
    }
    this.effort = v
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
      aimAddressToId: markRaw({}) as {[addr: string]: number},
      flows: {} as {[from: string]: {[into: string]: Flow}}, 
      selectedAim: undefined as Aim | undefined,
      selectedFlow: undefined as Flow | undefined, 
    }
  }, 
  actions: {
    async loadInitial() {
      await this.loadHome()
      this.loadPinned() 
    }, 
    async loadHome() {
      let summitsContract = useWeb3Connection().getSummitsContract()
      if(summitsContract) {
        const baseAimAddr = await summitsContract.baseAim()
        let home = await this.loadAim(baseAimAddr) 
        home.pinned = true

        const map = useMap()
        this.selectedAim = home

        // Gleichung: 
        // 100 = scale * home.r
        // scale = 100 / home.r
        map.scale = 200 / home.r

        // test transaction
        // await summitsContract.test() // test
      }
    }, 
    async loadPinned() {
      const pinningsStr = window.localStorage.getItem("pinnedAims")
      if(pinningsStr !== null && pinningsStr !== "") {
        const pinnings = pinningsStr.split(',')
        console.log("laoding pinned:", pinnings) 
        pinnings.forEach((addr: string) => {
          this.loadAim(addr).then(aim => {
            aim.pinned = true
          })
        })
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
      if(rawAim.address !== undefined) {
        this.aimAddressToId[rawAim.address] = rawAim.id
      }
      return this.aims[rawAim.id] 
    },
    async createAimOnChain(aim: Aim) {
      let summitsContract = useWeb3Connection().getSummitsContract()
      let price = aim.tokens * aim.tokens
      console.log("calling summits create aim with initial_tokens =", aim.tokens)
      if(summitsContract) {
        aim.pendingTransactions += 1
        try {
          let tx = await summitsContract.createAim(
            {
              title: aim.title, 
              description: aim.description, 
              status: aim.status, 
              effort: Math.trunc(aim.effort), 
              color: toRaw(aim.rgb), 
            },
            aim.tokenName,
            aim.tokenSymbol, 
            aim.tokens, 
            {
              value: price, 
            }
          )
          let rc = await tx.wait()
          aim.pendingTransactions -= 1 
          let creationEvent: any = rc.events.find((e: any) => e.event === 'AimCreation') 
          if(creationEvent) {
            aim.address = creationEvent.args.aimAddress
            this.aimAddressToId[aim.address!] = aim.id
            aim.tokenSupply = aim.tokens
            aim.tokensOnChain = aim.tokens
            aim.clearOrigin()
            this.togglePin(aim)
          }
        } catch {
          aim.pendingTransactions -= 1
        }
      }
    }, 
    async commitAimChanges(aim: Aim) {
      let fields: string[] = []
      let values: any[] = []
      let origin = aim.origin as any
      Object.getOwnPropertyNames(aim.origin).forEach((name: string) => {
        if(origin[name] !== undefined) {
          fields.push(name)
          values.push((aim as any)[name]) 
        }
      })
      let functionName = 'updateAim' + fields.map(f => f[0].toUpperCase() + f.slice(1)).join("")
      const w3 = useWeb3Connection()
      const aimContract = w3.getAimContract(aim.address!) 
      console.log("calling", functionName, "with", values) 
      aim.pendingTransactions += 1
      try {
        let tx = await aimContract[functionName](...values)
        let rc = await tx.wait()
        for(let name of fields) {
          delete origin[name]
        }
        aim.pendingTransactions -= 1
      } catch(err)  {
        console.error("Failed to commit aim changes", err) 
        aim.pendingTransactions -= 1
      }

    }, 
    async buyTokens(aim: Aim, amount: bigint, maxPrice: bigint) {
      console.log("buying tokens") 
      const w3 = useWeb3Connection()
      const aimContract = w3.getAimContract(aim.address!) 
      aim.pendingTransactions += 1
      try {
        let tx = await aimContract.buy(
          amount, 
          {
            value: maxPrice
          }
        )
        let rc = await tx.wait()
        aim.tokenSupply += amount
        aim.tokensOnChain = aim.tokens
        aim.pendingTransactions -= 1
      } catch(err)  {
        console.error("Failed to buy tokens", err) 
        aim.pendingTransactions -= 1
      }
    },
    async sellTokens(aim: Aim, amount: bigint, minPrice: bigint ) {
      console.log("selling tokens") 
      const w3 = useWeb3Connection()
      const aimContract = w3.getAimContract(aim.address!) 
      aim.pendingTransactions += 1
      try {
        let tx = await aimContract.sell(
          amount, 
          minPrice
        )
        let rc = await tx.wait()
        aim.tokenSupply -= amount
        aim.tokensOnChain = aim.tokens
        aim.pendingTransactions -= 1
      } catch(err)  {
        console.error("Failed to sell tokens", err) 
        aim.pendingTransactions -= 1
      }
    }, 
    async loadAim(aimAddr: string) {
      const w3 = useWeb3Connection()
      let aimContract = w3.getAimContract(aimAddr) 
      let dataPromises = []
      dataPromises.push(aimContract.data())
      dataPromises.push(aimContract.symbol())
      dataPromises.push(aimContract.name())
      dataPromises.push(aimContract.totalSupply())
      dataPromises.push(aimContract.getPermissions())
      dataPromises.push(aimContract.owner())
      dataPromises.push(aimContract.getInvestment())
      return await Promise.all(dataPromises).then(([
        data, symbol, name, supply, permissions, owner, tokens
      ]) => {
        const setValues = (aim: Aim) => {
          aim.address = aimAddr
          aim.title = data.title
          aim.description = data.description
          aim.setColor(Array.from(ethers.utils.arrayify(data.color)) as [number, number, number])
          aim.tokenName = name 
          aim.tokenSymbol = symbol
          aim.permissions = permissions
          aim.owner = owner
          const t = BigNumber.from(tokens).toBigInt()
          aim.tokenSupply = BigNumber.from(supply).toBigInt()
          aim.tokensOnChain = t
          aim.setTokens(t) 
        }
        console.log("on load, aim addr to id = ", this.aimAddressToId) 
        if(this.aimAddressToId[aimAddr] !== undefined) {
          let aim = this.aims[this.aimAddressToId[aimAddr]]
          setValues(aim) 
          return aim
        } else { 
          return this.createAim(setValues)
        }
      })
    }, 
    resetAimChanges(aim: Aim) {
      Object.entries(aim.origin).forEach(([key, value]) => {
        if(value !== undefined) {
          (aim as any)[key] = value
        }
      })
      aim.clearOrigin()
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

    // Flows
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
    togglePin(aim: Aim) {
      console.log("Addr", aim.address) 
      if(aim.address !== undefined) {
        const pinningsStr = window.localStorage.getItem("pinnedAims")
        if(pinningsStr !== null && pinningsStr !== "") {
          const pinnings = new Set(pinningsStr.split(','))
          if(aim.pinned) {
            pinnings.delete(aim.address) 
          } else {
            pinnings.add(aim.address) 
          }
          window.localStorage.setItem("pinnedAims", Array.from(pinnings).join(','))
        } else if (!aim.pinned) {
          window.localStorage.setItem("pinnedAims", aim.address) 
        }
        console.log("new pinnings loc st:", window.localStorage.getItem("pinnedAims"))
        aim.pinned = !aim.pinned
      }
    }
  }, 
})

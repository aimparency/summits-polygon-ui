/* This store contains all data that are related to aims and their connections. 
 * It is used by the sidebar and the map */

import { defineStore } from 'pinia'
import { useWeb3Connection } from './web3-connection'

import { BigNumber, ethers } from 'ethers'

import { useMap } from './map'
import { useUi } from './ui'

import * as vec2 from '../vec2'
import { markRaw, toRaw } from 'vue'

import config from '../config'

const PINNED_AIMS_STORAGE_KEY = "pinnedAims-" + config.network // use different storage TBD: support network switching after page load

export function randomAimColor() {
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

export function toHexColor(rgb: [number, number, number]) {
  return  '#' + rgb.map(c => ("0" + Math.floor(c).toString(16)).slice(-2)).join('') 
}

function clampFlowWeight(v: number) {
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

export class Member {
  constructor(
    public address: string,
    public permissions: number,
    public changed = false
  ){}
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

  suggestTokenNameAndSymbol = true
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
    edit: 0x01, 
    network: 0x02,
    manage: 0x04, 
    //...
    transfer: 0x80, 
  } 

  members?: Member[] 

  permissions = 0

  constructor() {
  }

  setColor(rgb: [number, number, number]) {
    this.color = toHexColor(rgb)
    this.rgb = rgb
  }

  setLoopWeight(v: number) {
    this.loopWeight = clampFlowWeight(v) 
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
  weight?: number
}

export class Flow {
  explanation: string = ""
  weight = 0x7fff;

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
    this.weight = v
    this.into.recalcWeights()
  }

  updateWeight(v: number) {
    v = clampFlowWeight(Math.round(v)) 
    if(v === this.origin.weight) {
      this.origin.weight = undefined
    } else if (this.origin.weight === undefined) {
      this.origin.weight = this.weight
    }
    this.setWeight(v) 
  }

  updateExplanation(v: string) {
    if(v === this.origin.explanation) { 
      this.origin.explanation = undefined
    } else if(this.origin.explanation === undefined) {
      this.origin.explanation = this.explanation
    }
    this.explanation = v
  }

  clearOrigin() {
    this.origin = new FlowOrigin()
  }
}

export const useAimNetwork = defineStore('aim-network', {
  state() {
    return {
      aims: {} as {[id: number]: Aim}, 
      flows: {} as {[from: string]: {[into: string]: Flow}}, 
      selectedAim: undefined as Aim | undefined,
      selectedFlow: undefined as Flow | undefined, 
      aimAddressToId: markRaw({}) as {[addr: string]: number},
      flowWaitList: markRaw({}) as {[addr: string]: Set<string>}, 
    }
  }, 
  actions: {
    async loadInitial() {
      await this.loadHome()
      // check url get parameters
      let urlParams = new URLSearchParams(window.location.search)
      let addr = urlParams.get('loadAim')
      if(addr) {
        await this.loadAim(addr)
      }
      this.loadPinned() 
    }, 
    async loadHome() {
      let summitsContract = useWeb3Connection().getSummitsContract()
      if(summitsContract) {
        const baseAimAddr = await summitsContract.baseAim()
        let home = await this.loadAim(baseAimAddr) 
        home.pinned = true

        const map = useMap()

        // Gleichung: 
        // 100 = scale * home.r
        // scale = 100 / home.r
        map.scale = 200 / home.r

        this.selectAim(home)

        // test transaction
        // await summitsContract.test() // test
      }
    }, 
    async loadPinned() {
      const pinningsStr = window.localStorage.getItem(PINNED_AIMS_STORAGE_KEY)
      if(pinningsStr !== null && pinningsStr !== "") {
        const pinnings = pinningsStr.split(',')
        pinnings.forEach((addr: string) => {
          this.loadAim(addr).then(aim => {
            aim.pinned = true
          }).catch(() => {
            console.log("could not load pinned aim") 
          })
        })
      }
    }, 
    // create and load aims
    createAndSelectAim(modifyAimCb?: (aim: Aim) => void) {
      this.selectedAim = this.createAim(aim => {
        aim.permissions = 0xff
        aim.setColor(randomAimColor())
        modifyAimCb && modifyAimCb(aim)
      })
      useUi().sideMenuOpen = true
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
      aim.pendingTransactions += 1
      try {
        let tx = await aimContract[functionName](...values)
        let rc = await tx.wait()
        for(let name of fields) { // TBD: maybe just assign new AimOrigin() ? 
          delete origin[name]
        }
        aim.pendingTransactions -= 1
      } catch(err)  {
        console.error("Failed to commit aim changes", err) 
        aim.pendingTransactions -= 1
      }

    }, 
    async commitAimMemberChanges(aim: Aim) {
      if(aim.members) { 
        let addresses: string[] = []
        let permissions: number[] = []
        let includedMembers: Member[] = []
        aim.members.forEach((member: Member) => {
          if(member.changed) {
            addresses.push(member.address)
            permissions.push(member.permissions)
            includedMembers.push(member)
          }
        })
        if(addresses.length > 0) {
          try {
            const w3 = useWeb3Connection()
            const aimContract = w3.getAimContract(aim.address!) 
            aim.pendingTransactions += 1
            if(addresses.length == 1) {
              let tx = await aimContract.setPermissions(addresses[0], permissions[0])
              await tx.wait()
            } else {
              let tx = await aimContract.setPermissionsForMultipleMembers(addresses, permissions)
              await tx.wait()
            }
            aim.pendingTransactions -= 1
            includedMembers.forEach((member: Member) => {
              member.changed = false
            })
          } catch(err) {
            console.error("Failed to commit aim member changes", err)
            aim.pendingTransactions -= 1
          }
          // set members changed to false for include members
        }
      }
    }, 
    async buyTokens(aim: Aim, amount: bigint, maxPrice: bigint) {
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
      dataPromises.push(aimContract.symbol()) // candidate for lazy load
      dataPromises.push(aimContract.name()) // candidate for lazyLoadAimDetails
      dataPromises.push(aimContract.totalSupply())
      dataPromises.push(aimContract.getPermissions())
      dataPromises.push(aimContract.owner())
      dataPromises.push(aimContract.getInvestment()) // candidate for lazy load
      dataPromises.push(aimContract.getContributors()) 
      return await Promise.all(dataPromises).then(([
        data, symbol, name, supply, permissions, owner, tokens, contributors, members
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
          aim.members = members
          aim.setTokens(t) 
          for(let fromAddr of contributors) {
            if(this.aimAddressToId[fromAddr] !== undefined) {
              this.loadFlow(fromAddr, aimAddr) 
            } else {
              // put into list
              if(this.flowWaitList[fromAddr]) {
                this.flowWaitList[fromAddr].add(aimAddr) 
              } else {
                this.flowWaitList[fromAddr] = new Set<string>([aimAddr])
              }
              this.loadAim(fromAddr) 
            }
          }
          if(this.flowWaitList[aimAddr]) {
            this.flowWaitList[aimAddr].forEach((intoAddr: string) => {
              this.loadFlow(aimAddr, intoAddr) 
            })
          }
        }
        if(this.aimAddressToId[aimAddr] !== undefined) {
          let aim = this.aims[this.aimAddressToId[aimAddr]]
          setValues(aim) 
          return aim
        } else { 
          return this.createAim(setValues)
        }
      })
    }, 
    lazyLoadAim(aim: Aim) {
      if(aim.address) {
        const w3 = useWeb3Connection()
        let aimContract = w3.getAimContract(aim.address) 
        let dataPromises = []
        dataPromises.push(aimContract.getMembers()) 
        Promise.all(dataPromises).then(([
          memberAddrs
        ]) => {
          console.log(memberAddrs) 
          let permissionPromises = []
          for(let memberAddr of memberAddrs) {
            permissionPromises.push(aimContract.permissions(memberAddr))
          }
          Promise.all(permissionPromises).then(permissions => {
            let members = []
            for(let i = 0; i < memberAddrs.length; i++) {
              members.push(new Member(
                memberAddrs[i], 
                permissions[i]
              ))
            }
            aim.members = members
          })
        })
      }
    },
    async loadFlow(fromAddr: string, intoAddr: string) {
      const w3 = useWeb3Connection()
      let aimContract = w3.getAimContract(intoAddr) 
      let flowFromChain = await aimContract.inflows(fromAddr) 

      let fromAim = this.aims[this.aimAddressToId[fromAddr]]
      let intoAim = this.aims[this.aimAddressToId[intoAddr]]

      this.createFlow(fromAim, intoAim, (flow: Flow) => {
        flow.explanation = flowFromChain.data.explanation
        flow.weight = flowFromChain.data.weight
        flow.published = true
        flow.dx = 1 // decode bytes from flowFromChain.data.d2d
        flow.dy = 1 // decode bytes
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
        if((Aim.Permissions.network & into.permissions) > 0) {
          let flow = this.createFlow(from, into)
          if(flow) {
            this.selectFlow(flow) 
            useUi().sideMenuOpen = true
          }
        } else {
          throw(Error("you need certain permissions for the receiving aim in order to draw a flow")) 
        }
      }
    }, 
    createFlow(from: Aim, into: Aim, cb?: (flow: Flow) => void) : Flow | undefined {
      let rawFlow = new Flow(from, into) 
      if(cb) {
        cb(rawFlow) 
      }

      const bucket = this.flows[from.id] 
      if(bucket) {
        bucket[into.id] = rawFlow
      } else {
        this.flows[from.id] = { 
          [into.id]: rawFlow
        }
      }
      const flow = this.flows[from.id][into.id]

      from.flowsInto[into.id] = flow 
      into.flowsFrom[from.id] = flow

      into.recalcWeights()

      return flow
    }, 
    async createFlowOnChain(flow: Flow) {
      if(flow.from.address && flow.into.address) {
        let aimContract = useWeb3Connection().getAimContract(flow.into.address) 
        flow.pendingTransactions += 1
        try {
          let tx = await aimContract.createInflow(
            flow.from.address, 
            {
              explanation: flow.explanation, 
              weight: flow.weight, 
              d2d: new Uint8Array([0,0,0,0,0,0,0,0])
            }
          )
          let rc = await tx.wait()
          flow.pendingTransactions -= 1 
          flow.published = true
          let creationEvent: any = rc.events.find((e: any) => e.event === 'FlowCreation') 
          if(creationEvent) {
            flow.clearOrigin()
          }
        } catch(error: any) {
          console.error(error) 
          flow.pendingTransactions -= 1
        }
      }
    }, 
    // edit and remove flows
    makeUpdateFunctionCall(obj: any, type: string) : [string, any[]] {
      let fields: string[] = []
      let args: any[] = []
      let origin = obj.origin as any
      Object.getOwnPropertyNames(origin).forEach((name: string) => {
        if(origin[name] !== undefined) {
          fields.push(name)
          args.push(obj[name]) 
        }
      })
      let functionName = 'update' + type + fields.map(f => f[0].toUpperCase() + f.slice(1)).join("")
      return [functionName, args]
    }, 
    async commitFlowChanges(flow: Flow) {
      let [functionName, args] = this.makeUpdateFunctionCall(flow, "Flow") 
      const w3 = useWeb3Connection()
      const aimContract = w3.getAimContract(flow.into.address!) 
      flow.pendingTransactions += 1
      try {
        let tx = await aimContract[functionName](flow.from.address!, ...args)
        let rc = await tx.wait()
        flow.clearOrigin()
        flow.pendingTransactions -= 1
      } catch(err)  {
        console.error("Failed to commit aim changes", err) 
        flow.pendingTransactions -= 1
      }
    }, 
    resetFlowChanges(flow: Flow) {
      Object.entries(flow.origin).forEach(([key, value]) => {
        if(value !== undefined) {
          (flow as any)[key] = value
        }
      })
      flow.clearOrigin()
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
      this.lazyLoadAim(aim) 
    },
    deselect() {
      this.selectedAim = undefined
      this.selectedFlow = undefined
    },
    togglePin(aim: Aim) {
      if(aim.address !== undefined) {
        const pinningsStr = window.localStorage.getItem(PINNED_AIMS_STORAGE_KEY)
        if(pinningsStr !== null && pinningsStr !== "") {
          const pinnings = new Set(pinningsStr.split(','))
          if(aim.pinned) {
            pinnings.delete(aim.address) 
          } else {
            pinnings.add(aim.address) 
          }
          window.localStorage.setItem(PINNED_AIMS_STORAGE_KEY, Array.from(pinnings).join(','))
        } else if (!aim.pinned) {
          window.localStorage.setItem(PINNED_AIMS_STORAGE_KEY, aim.address) 
        }
        aim.pinned = !aim.pinned
      }
    }
  }, 
})

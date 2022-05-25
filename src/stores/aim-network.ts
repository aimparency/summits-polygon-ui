import { defineStore } from 'pinia'
import { useWeb3Connection } from './web3-connection'


export class Aim {
  title: string = ""
  detailsCid: string = "" 
  effort: BigInt = 0n

  onchain = true

  flows_from: Aim[] = []
  flows_into: Aim[] = []

  constructor(
    public id: string, 
    public owner: string, 
    public subLevel: number
  ) {
  }
}

export class Flow {
  detailsCid: string = ""
  share: number = 0
}

export const useAimNetwork = defineStore('aim-network', {
  state() {
    return {
      aims: {} as {[id: string]: Aim}, 
      flows: {} as {[from: string]: {[into: string]: Flow}}
    }
  }, 
  actions: {
    async loadHomeNode() {
      console.log("loading home node") 
      let web3 = useWeb3Connection()
      if(web3.contract !== undefined) {
        console.log(web3.contract) 
        const data = await web3.contract.homes(web3.address)
        console.log(data) 
      }
//      web3Connection.$state.

    }
  }
})

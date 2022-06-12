import { defineStore } from 'pinia'

import { Contract, ethers } from "ethers";
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers'

import config from '../config'
import Summits from '../Summits.json'
import Aim from '../Aim.json'

let provider: Web3Provider
let signer: JsonRpcSigner

let summitsContract: Contract
let aimContracts: {[address: string]: Contract} = {}

export const useWeb3Connection = defineStore('web3-connection', {
  state() {
    return {
      connected: false, 
      network: "", 
      address: "", 
    }
  }, 
  actions: {
    async connect(
      onConnect: () => void, 
    ) {
      provider = new ethers.providers.Web3Provider((window as any).ethereum) 
      await provider.send("eth_requestAccounts", [])
      signer = provider.getSigner()

      provider.getNetwork().then((network) => {
        this.network = network.name
      })
      
      signer.getAddress().then((address) => {
        this.address = address
      }) 

      summitsContract = new ethers.Contract(
        config.contractAddress, 
        Summits.abi, 
        signer 
      );

      onConnect()
    },
    getSummitsContract() {
      return summitsContract
    },
    getAimContract(address: string) {
      let contract = aimContracts[address]
      if(!contract) {
        contract = aimContracts[address] = new ethers.Contract(
          address,
          Aim.abi,
          signer
        ) 
      }
      console.log("aimcontract", contract)
      return contract
    }
  }, 
}) 

import { defineStore } from 'pinia'

import { Contract, ethers } from "ethers";
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers'

import config from '../config'
import Summits from '../Summits.json'
import Aim from '../Aim.json'

let network = config.networks[config.network]

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
      let ethereum = (window as any).ethereum

      if(ethereum.networkVersion !== network.chainId) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + network.chainId.toString(16) }]
          });
        } catch (err: any) {
            // This error code indicates that the chain has not been added to MetaMask
          if (err.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainName: network.name,
                  chainId: '0x' + network.chainId.toString(16),
                  nativeCurrency: Object.assign({}, network.nativeCurrency), 
                  rpcUrls: [network.url]
                }
              ]
            });
          }
        }
      }

      provider = new ethers.providers.Web3Provider(ethereum) 
      await provider.send("eth_requestAccounts", [])
      signer = provider.getSigner()

      provider.getNetwork().then((network) => {
        this.network = network.name
      })
      
      signer.getAddress().then((address) => {
        this.address = address
      }) 

      summitsContract = new ethers.Contract(
        network.contractAddress, 
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
      return contract
    }
  }, 
}) 



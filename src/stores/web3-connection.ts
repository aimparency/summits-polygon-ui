import {markRaw} from 'vue'
import { defineStore } from 'pinia'
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers'

import Web3Modal from "web3modal";

import { Contract, ethers } from "ethers";

import config from '../config'
import Summits from '../Summits.json'

export const useWeb3Connection = defineStore('web3-connection', {
  state() {
    return {
      provider: undefined as undefined | Web3Provider,
      signer: undefined as undefined | JsonRpcSigner, 
      connected: false, 
      network: "", 
      address: "", 
      contract: undefined as undefined | Contract,  
    }
  }, 
  actions: {
    async connect(
      onConnect: () => void, 
    ) {
      const providerOptions = {
        /* See Provider Options Section */
      };
      const web3Modal = new Web3Modal({
        network: "mainnet", // optional
        cacheProvider: true, // optional
        providerOptions, // required
      });

      const instance = await web3Modal.connect()

      let provider = new ethers.providers.Web3Provider(instance)
      this.provider = markRaw(provider)

      let signer = provider.getSigner()
      this.signer = markRaw(signer)

      provider.getNetwork().then((network: ethers.providers.Network) => {
        this.network = network.name
      })
      this.address = await signer.getAddress()

      console.log("abi", Summits.abi)
      let contract = new ethers.Contract(
        config.contractAddress, 
        Summits.abi, 
        signer 
      );

      this.contract = markRaw(contract) 

      console.log("contract", this.contract) 

      onConnect()
    },
  }
}) 

import {markRaw} from 'vue'
import { defineStore } from 'pinia'
import { Web3Provider, JsonRpcSigner } from '@ethersproject/providers'

import Web3Modal from "web3modal";

import { ethers } from "ethers";

export const useWeb3Connection = defineStore('web3Connection', {
  state() {
    return {
      provider: undefined as undefined | Web3Provider,
      signer: undefined as undefined | JsonRpcSigner, 
      connected: false, 
      network: "", 
      address: ""
    }
  }, 
  actions: {
    async connect() {
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

      console.log(provider)
      provider.getNetwork().then((network: ethers.providers.Network) => {
        this.network = network.name
      })
      this.address = await signer.getAddress()

    },
  }
}) 

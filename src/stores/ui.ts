import { defineStore } from 'pinia'
import { Aim, Flow } from './aim-network'

export const useUi = defineStore('ui', {
  state() {
    return {
      selectedAim: Aim, 
      selectedFlow: Flow, 
    }
  }
})

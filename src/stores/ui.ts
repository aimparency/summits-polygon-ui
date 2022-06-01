import { defineStore } from 'pinia'

import * as vec2 from '../vec2'

export const useUi = defineStore('ui', {
  state() {
    return {
      screenSize: vec2.create(),
      sideMenuOpen: true,
    }
  }, 
  actions: {
    setScreenSize(x: number, y: number) {
      this.screenSize = vec2.fromValues(x, y)
    }, 
    toggleSideMenu() {
      this.sideMenuOpen = !this.sideMenuOpen
    }, 
  }
})

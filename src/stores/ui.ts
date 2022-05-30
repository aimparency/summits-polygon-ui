import { defineStore } from 'pinia'

import Vec2 from 'gl-vec2'

export const useUi = defineStore('ui', {
  state() {
    return {
      screenSize: Vec2.create(),
      sideMenuOpen: true,
    }
  }, 
  actions: {
    setScreenSize(x: number, y: number) {
      this.screenSize = Vec2.fromValues(x, y)
    }, 
    toggleSideMenu() {
      this.sideMenuOpen = !this.sideMenuOpen
    }, 
  }
})

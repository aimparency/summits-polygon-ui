import { defineStore } from 'pinia'

import Vec2 from 'gl-vec2'

export const useUi = defineStore('ui', {
  state() {
    return {
      screenSize: Vec2.create(),
      sideMenuOpen: true,
      view: 'localList' as 'localList' | 'aimDetails' | 'flowDetails'
    }
  }, 
  actions: {
    setScreenSize(x: number, y: number) {
      this.screenSize = Vec2.fromValues(x, y)
    }, 
    toggleSideMenu() {
      this.sideMenuOpen = !this.sideMenuOpen
    }, 
    showAimDetails() {
      this.view = 'aimDetails'
    }, 
    goBack() {
      if(this.view == 'aimDetails') {
        this.showLocalList()
      }
    }, 
    showLocalList() {
      this.view = 'localList'
    }
  }
})

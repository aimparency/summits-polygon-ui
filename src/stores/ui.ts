import { defineStore } from 'pinia'

import * as vec2 from '../vec2'

import { useMap } from './map'

export class Hint {
  constructor(
    public message: string, 
    public position: vec2.T, 
    public color: string,
  ) {}
} 

let closeTimeout: ReturnType<typeof setTimeout> | null = null 

export const useUi = defineStore('ui', {
  state() {
    return {
      screenSize: vec2.create(),
      sideMenuOpen: false,
      hint: undefined as undefined | Hint     
    }
  }, 
  actions: {
    setScreenSize(x: number, y: number) {
      this.screenSize = vec2.fromValues(x, y)
    }, 
    toggleSideMenu() {
      this.sideMenuOpen = !this.sideMenuOpen
    }, 
    setError(msg: string, pos?: vec2.T) {
      this.setHint(msg, "#aa1112", pos)
    }, 
    setWarning(msg: string, pos?: vec2.T) {
      this.setHint(msg, "#999901", pos)
    }, 
    setInfo(msg: string, pos?: vec2.T) {
      this.setHint(msg, "#66bbff", pos)
    }, 
    setHint(msg: string, color: string, pos?: vec2.T) {
      let duration = msg.length * 50 + 1000
      if(pos == undefined) {
        pos = vec2.clone(useMap().mouse.physical)
      }
      this.hint = new Hint(msg, pos, color)
      closeTimeout = setTimeout(() => {
        this.closeHint()
      }, duration)
    }, 
    closeHint() {
      this.hint = undefined
      if(closeTimeout !== null) {
        closeTimeout = null
      }
    }
  }
})

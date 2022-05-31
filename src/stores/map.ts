import { defineStore } from 'pinia'

import * as vec2 from '../vec2'
import { Aim } from './aim-network'

type maybeAim = undefined | Aim

export const useMap = defineStore('map', {
  state() {
    return {
      scale: 1, 
      offset: vec2.fromValues(0,0),
      mouse: {
        logical: vec2.fromValues(0,0), 
        physical: vec2.fromValues(0,0)
      },
      halfSide: 0, 
      logicalHalfSide: 1000, 
      panBeginning: undefined as undefined | { page: vec2.T, offset: vec2.T },
      dragBeginning: undefined as undefined | { page: vec2.T, pos: vec2.T },
      connecting: false, 
      preventReleaseClick: false,
      clientOffset: vec2.create(),
      connectFrom: undefined as maybeAim,
      dragCandidate: undefined as maybeAim, 
    }
  }, 
  actions: {
    updateMouse(physicalMouse: vec2.T) {
      this.mouse.physical = physicalMouse
      this.mouse.logical = this.physicalToLogicalCoord(physicalMouse)
    }, 
    physicalToLogicalCoord(coord: vec2.T) : vec2.T {
      let result = vec2.clone(coord) 
      vec2.sub(result, result, this.clientOffset) 
      vec2.scale(result, result, 1 / this.halfSide) 
      vec2.sub(result, result, [1,1]) 
      vec2.scale(result, result, this.logicalHalfSide / this.scale) 
      vec2.sub(result, result, this.offset) 
      return result
    }, 
    zoom(f: number, mouse: vec2.T) {
      let mouseBefore = this.physicalToLogicalCoord(mouse)
      this.scale *= f
      let mouseAfter = this.physicalToLogicalCoord(mouse) 
      vec2.sub(mouseAfter, mouseAfter, mouseBefore) 
      vec2.add(this.offset, this.offset, mouseAfter) 
    },
    startConnecting(aim: Aim) {
      this.connectFrom = aim
    }, 
    startDragging(aim: Aim) {
      this.dragCandidate = aim
    }
  }
})

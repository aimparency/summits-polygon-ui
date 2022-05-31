import { defineStore } from 'pinia'

import Vec2 from 'gl-vec2'
import { Aim } from './aim-network'
type V2 = number[]

type maybeAim = undefined | Aim

export const useMap = defineStore('map', {
  state() {
    return {
      scale: 1, 
      offset: Vec2.fromValues(0,0),
      mouse: {
        logical: Vec2.fromValues(0,0), 
        physical: Vec2.fromValues(0,0)
      },
      halfSide: 0, 
      logicalHalfSide: 1000, 
      panBeginning: undefined as undefined | { page: V2, offset: V2 },
      dragBeginning: undefined as undefined | { page: V2, offset: V2 },
      preventReleaseClick: false,
      clientOffset: Vec2.create(),
      connectFrom: undefined as maybeAim,
      dragCandidate: undefined as maybeAim, 
    }
  }, 
  actions: {
    updateMouse(physicalMouse: V2) {
      this.mouse.physical = physicalMouse
      this.mouse.logical = this.physicalToLogicalCoord(physicalMouse)
    }, 
    physicalToLogicalCoord(coord: V2) : V2 {
      let result = Vec2.clone(coord) 
      Vec2.sub(result, result, this.clientOffset) 
      Vec2.scale(result, result, 1 / this.halfSide) 
      Vec2.sub(result, result, [1,1]) 
      Vec2.scale(result, result, this.logicalHalfSide / this.scale) 
      Vec2.sub(result, result, this.offset) 
      return result
    }, 
    zoom(f: number, mouse: V2) {
      let mouseBefore = this.physicalToLogicalCoord(mouse)
      this.scale *= f
      let mouseAfter = this.physicalToLogicalCoord(mouse) 
      Vec2.sub(mouseAfter, mouseAfter, mouseBefore) 
      Vec2.add(this.offset, this.offset, mouseAfter) 
    },
    startConnecting(aim: Aim) {
      this.connectFrom = aim
    }, 
    startDragging(aim: Aim) {
      this.dragCandidate = aim
    }
  }
})

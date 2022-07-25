import { defineStore } from 'pinia'

import * as vec2 from '../vec2'
import { Aim } from './aim-network'

type maybeAim = undefined | Aim

export const LOGICAL_HALF_SIDE = 1000

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
      xratio: 1, 
      yratio: 1, 
      panBeginning: undefined as undefined | { page: vec2.T, offset: vec2.T },
      dragBeginning: undefined as undefined | { page: vec2.T, pos: vec2.T },
      connecting: false, 
      preventReleaseClick: false,
      clientOffset: vec2.create(),
      connectFrom: undefined as maybeAim,
      dragCandidate: undefined as maybeAim, 
      anim: {
        duration: 0.5, 
        t0: 0, 
        update: undefined as undefined | (() => void),
      }
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
      vec2.scale(result, result, LOGICAL_HALF_SIDE / this.scale) 
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
    }, 
    centerOnAim(aim: Aim) {
      // Gleichung: 
      // 100 = scale * home.r
      // scale = 100 / home.r
      const offset0 = vec2.clone(this.offset) 
      const scale0 = this.scale
      this.anim.t0 = Date.now()
      this.anim.update = () => {
        let progress = (Date.now() - this.anim.t0) / 1000 / this.anim.duration 
        if(progress >= 1) {
          progress = 1
          this.anim.update = undefined
        } else {
          progress = (1 - Math.cos(progress * Math.PI)) / 2
        }
        vec2.add(this.offset, vec2.crScale(offset0, 1 - progress), vec2.crScale(aim.pos, -progress))
        this.scale = scale0 * (1 - progress) + 200 / aim.r * progress 
      }
    }
  }
})

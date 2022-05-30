import { defineStore } from 'pinia'

import Vec2 from 'gl-vec2'
type V2 = number[]

export const useMap = defineStore('map', {
  state() {
    return {
      scale: 1, 
      offset: Vec2.fromValues(0,0),
      mouse: {
        logical: Vec2.fromValues(0,0), 
        physical: Vec2.fromValues(0,0)
      },
      panBeginning: undefined as undefined | { page: V2, offset: V2 },
      dragBeginning: undefined as undefined | { page: V2, offset: V2 },
      preventReleaseClick: false,
    }
  }, 
  actions: {
    updateMouse(physicalMouse: V2) {
      this.mouse.physical = physicalMouse
      this.mouse.logical = this.physicalToLogicalCoord(physicalMouse)

    }, 
    physicalToLogicalCoord(coord: V2) : V2 {
      let halfSide, xOffset, yOffset
      if(window.innerWidth < window.innerHeight) {
        halfSide = window.innerWidth / 2
        xOffset = 0
        yOffset = (window.innerHeight - window.innerWidth) / 2
      } else {
        halfSide = window.innerHeight / 2
        xOffset = (window.innerWidth - window.innerHeight) / 2
        yOffset = 0
      }
      return Vec2.fromValues(
        (1 - (coord[0] + xOffset) / halfSide) / this.scale - this.offset[0],
        (1 - (coord[1] + yOffset) / halfSide) / this.scale - this.offset[1]
      )
    }
  }
})

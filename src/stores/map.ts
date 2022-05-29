import { defineStore } from 'pinia'

import { Vector2 } from 'three'

export const useMap = defineStore('map', {
  state() {
    return {
      mouse: {
        logical: new Vector2(0,0), 
        physical: new Vector2(0,0)
      }
    }
  }
})

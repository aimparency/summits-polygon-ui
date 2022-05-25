import { defineStore } from 'pinia'

export class AimAppearance {
  public color: string | undefined

  constructor(
    public x: number, 
    public y: number,
    public r: number
  ) {
  }
}

export const useMap = defineStore('map', {
  state() {
    return {
    }
  }
})

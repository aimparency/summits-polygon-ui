<template>
  <svg 
    ref="canvas"
    class='aim-map'
    :viewBox="viewBox">
    <defs>
      <pattern id="unpublished" width="1" height="1" patternTransform="scale(0.8) rotate(-45 0 0)" patternUnits="userSpaceOnUse">
        <rect x1="0" y1="0" width="1" height="0.5" style="stroke:none; fill:#2222" />
      </pattern>
    </defs>
    <g :transform="transform">
      <FlowSVG v-for="flow in flows" 
        :key="`${flow.from.id}x${flow.into.id}`"
        :flow="flow"/>
      <Connector 
        v-if="map.connectFrom !== undefined"
        :connectFrom="map.connectFrom"/>
      <AimSVG v-for="aim in aims" 
        :key="aim.id"
        :aim="aim"/>
      <!--rect
        :x="- map.offset[0] - map.logicalHalfSide * map.xratio * 0.5 / map.scale"
        :y="- map.offset[1] - map.logicalHalfSide * map.yratio * 0.5 / map.scale"
        :width="map.logicalHalfSide * map.xratio / map.scale"
        :height="map.logicalHalfSide * map.yratio / map.scale"
        stroke="#0f0"
        fill="none"
      /-->
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent, toRaw } from "vue";

import AimSVG from './AimSVG.vue';
import FlowSVG from './FlowSVG.vue';
import Connector from './Connector.vue';

import { Aim, Flow, useAimNetwork } from '../stores/aim-network'
import { useMap } from '../stores/map'
import { useUi } from '../stores/ui'

import boxIntersect from 'box-intersect'

import * as vec2 from '../vec2'

const outerMarginFactor = 2
const hShift = vec2.create()

export default defineComponent({
  name: "Map",
  components: {
    AimSVG, 
    FlowSVG, 
    Connector
  },
  data() {
    return {
      aimNetwork: useAimNetwork(),
      map: useMap(), 
    }
  }, 
  props: {
    msg: String,
  },
  mounted() {
    const canvas = this.$refs.canvas as SVGElement

    const updateHalfSide = () => {
      let w = canvas.clientWidth 
      let h = canvas.clientHeight
      if(w > h) {
        this.map.clientOffset = [(w - h) / 2, 0]
        this.map.halfSide = h / 2
        this.map.xratio = w/h
        this.map.yratio = 1
      } else {
        this.map.clientOffset = [0, (h - w) / 2]
        this.map.halfSide = w / 2
        this.map.xratio = 1
        this.map.yratio = h/w
      }
    }
    window.addEventListener("resize", updateHalfSide)
    updateHalfSide()

    const updatePan = (mouse: vec2.T) => {
      const pb = this.map.panBeginning; 
      if(pb !== undefined) {
        const d = vec2.crSub(pb.page, mouse)
        if(vec2.len2(d) > 25) {
          this.map.preventReleaseClick = true
          vec2.scale(d, d, this.map.logicalHalfSide / (this.map.halfSide * this.map.scale)) 
          const offset = vec2.clone(pb.offset)
          vec2.sub(offset, offset, d)
          this.map.offset = offset  
        }
      }
    }

    const updateDrag = (mouse: vec2.T) => {
      const db = this.map.dragBeginning;
      const aim = this.map.dragCandidate; 
      if(db && aim) {
        const d = vec2.clone(db.page)
        vec2.sub(d, d, mouse) 
        if(vec2.len2(d) > 25) {
          this.map.preventReleaseClick = true
          vec2.scale(d, d, this.map.logicalHalfSide / (this.map.halfSide * this.map.scale)) 
          const pos = vec2.clone(db.pos)
          vec2.sub(pos, pos, d) 
          aim.pos = pos
        }
      }
    }

    const beginWhatever = (mouse: vec2.T) => {
      if(this.map.connectFrom) {
        this.map.connecting = true
        this.map.preventReleaseClick = true
      } else if(this.map.dragCandidate) {
        beginDrag(this.map.dragCandidate, mouse)
      } else {
        beginPan(mouse) 
      }
    }

    const beginPan = (mouse: vec2.T) => {
      this.map.panBeginning = {
        page: vec2.clone(mouse), 
        offset: vec2.clone(this.map.offset)
      }
    }
    const beginDrag = (aim: Aim, mouse:vec2.T) => {
      //this.aimNetwork.deselect()
      this.map.dragBeginning = {
        page: vec2.clone(mouse),
        pos: vec2.clone(aim.pos) 
      }
    }

    const endWhatever = () : void => {
      this.map.connectFrom = undefined
      if(this.map.panBeginning) {
        endPan(); 
      } else if (this.map.dragBeginning) {
        endDrag();
      }
      setTimeout(() => { this.map.preventReleaseClick = false })
    }

    const endPan = () => {
      delete this.map.panBeginning; 
    }

    const endDrag = () => {
      if(this.map.preventReleaseClick && this.map.dragCandidate) {
        //TBD: this.aimNetwork.relocate()
      }
      delete this.map.dragBeginning; 
      delete this.map.dragCandidate; 
    }

    const updateWhatever = (mouse: vec2.T) : void => {
      this.map.updateMouse(mouse)
      if(this.map.panBeginning) {
        updatePan(mouse); 
      } else if (this.map.dragBeginning) {
        updateDrag(mouse); 
      }
    }

    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      updateWhatever([e.clientX, e.clientY])
    })

    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      const mouse = vec2.fromValues(e.clientX, e.clientY)
      beginWhatever(mouse)
    })

    canvas.addEventListener("mouseup", () => {
      endWhatever() 
    })

    canvas.addEventListener("wheel", (e: WheelEvent) => {
      const mouse = vec2.fromValues(e.clientX, e.clientY)
      const f = Math.pow(1.1, -e.deltaY / 150)
      this.map.zoom(f, mouse) 
    })

    let touch = {
      currentCount: 0, 
      dragFingerId: 0, 
    }
    let pinchBeginning: undefined | {
      first: number, 
      second: number, 
      mLogical: vec2.T, 
      distancePage: number, 
      offset: vec2.T, 
      scale: number, 
    };
    canvas.addEventListener("touchstart", (e: TouchEvent) => { 
      if(e.touches.length > 0) {
        if(e.touches.length > 1) {
          // 2 or more touches         
          if(touch.currentCount < 2) {
            this.map.connectFrom = undefined
            touch.currentCount = 2
            // page coordinates
            let firstPage = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
            let secondPage = vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY)
            let mPhysical = vec2.clone(firstPage) 
            vec2.add(mPhysical, mPhysical, secondPage) 
            vec2.scale(mPhysical, mPhysical, 0.5) 
            let mLogical = this.map.physicalToLogicalCoord(mPhysical) 
            // model/svg coordinates
            pinchBeginning = {
              first: e.touches[0].identifier, 
              second: e.touches[1].identifier, 
              mLogical, 
              distancePage: vec2.dist(firstPage, secondPage), 
              offset: vec2.clone(this.map.offset), 
              scale: this.map.scale
            }
          } 
        } else {
          // 1 touch
          if(touch.currentCount == 0) {
            // new touch 
            touch.currentCount = 1
            touch.dragFingerId = e.touches[0].identifier
            let mouse = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
            beginWhatever(mouse)
          } else if (touch.currentCount > 1) {
            // from 2 or more to 1
            pinchBeginning = undefined // end pinch
          }
        }
      }
    });

    canvas.addEventListener("touchmove", (e: TouchEvent) => { 
      e.preventDefault()
      if(touch.currentCount == 1) {
        let mouse = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
        updateWhatever(mouse)
      } else if (touch.currentCount > 1) {
        if(pinchBeginning) {
          // update pinch
          const map = this.map

          let firstPage = vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
          let secondPage = vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY)
          let distancePage = vec2.dist(firstPage, secondPage)

          let mPhysical = vec2.clone(firstPage) 
          vec2.add(mPhysical, mPhysical, secondPage) 
          vec2.scale(mPhysical, mPhysical, 0.5) 
          let mLogical = this.map.physicalToLogicalCoord(mPhysical) 

          // 
          let scaleChange = distancePage / pinchBeginning.distancePage 
          map.scale = pinchBeginning.scale * scaleChange

          vec2.sub(mLogical, mLogical, pinchBeginning.mLogical) 

          vec2.add(this.map.offset, this.map.offset, mLogical) 
        }
      }
    })

    const finishTouch = () => {
      if(touch.currentCount > 1) {
        pinchBeginning = undefined
      } 
      if(touch.currentCount > 0) {
        endWhatever()
      }
      touch.currentCount = 0
    }

    canvas.addEventListener("touchend", finishTouch) 
    canvas.addEventListener("touchcancel", finishTouch) 

    canvas.addEventListener("click", () => {
      if(!this.map.preventReleaseClick) {
        if(this.aimNetwork.selectedAim || this.aimNetwork.selectedFlow) {
          this.aimNetwork.deselect()
        } else {
          let ui = useUi()
          if(ui.sideMenuOpen) {
            ui.sideMenuOpen = false
          } else {
            this.aimNetwork.createAndSelectAim((aim: Aim) => {
              aim.pos = vec2.clone(this.map.mouse.logical)
              // r * scale soll 100 sein
              let tR = BigInt(Math.trunc(1000 * 150 / this.map.scale))
              tR *= tR
              aim.setTokens(tR)
              aim.tokensOnChain = 0n
            })
          }
        }
      }
    });
  
    this.layout()

    // DEBUG
    // for(let i = 0; i < 19; i++) {
    //   setTimeout(this.aimNetwork.createAndSelectAim.bind(this), i * 3000)
    // }
  }, 
  computed: {
    viewBox() : string {
      return [-1,-1,2,2].map((v: number) => v * this.map.logicalHalfSide).join(' ')
    }, 
    transform() : string {
      return [
        `scale(${this.map.scale})`, 
        `translate(${this.map.offset[0]}, ${this.map.offset[1]})`, 
      ].join(' ')
    }, 
    flows() : Flow[] {
      let flows: Flow[] = []
      let flow = undefined
      for(let fromId in this.aimNetwork.flows) {
        let intoFlows = this.aimNetwork.flows[fromId]
        for(let intoId in intoFlows) {
          flow = intoFlows[intoId]
          if(flow !== this.aimNetwork.selectedFlow) {
            flows.push(intoFlows[intoId]) 
          }
        }
      }
      if(this.aimNetwork.selectedFlow) {
        flows.push(this.aimNetwork.selectedFlow) 
      }
      return flows; 
    }, 
    aims() : Aim[] {
      let aims = Object.values(this.aimNetwork.aims)
      let selectedAim = this.aimNetwork.selectedAim
      if(selectedAim) {
        aims = aims.filter(aim => aim !== selectedAim)
      }
      aims = aims.filter(aim => aim.loadLevel < 0).concat(
        aims.filter(aim => aim.loadLevel >= 0)
      )
      if(selectedAim) {
        aims.push(selectedAim)
      }
      return aims
    }, 
  },
  methods: {
    layout() {
      let aims = toRaw(this.aimNetwork.aims) // expecting slight performance boost from toRaw
      let map = this.map

      /* there is 
        - aimId: the string
        - aimIndex: the index of an aim in all the following arrays like r[]
        - boxIndex: the index of an aim in the boxes array */

      let aimIdToIndex: {[aimId: number]: number} = {}
      let aimIndexToId: number[] = []
      let r: number[] = []
      let tr
      let pos: vec2.T[] = []
      let shifts :vec2.T[] = []

      let boxes: number[][] = []
      const boxToAimIndex: number[] = []
      const relevantAims = new Set()

      let aim
      let left, right, top, bottom

      let mapWidth = map.logicalHalfSide * map.xratio * 2 / map.scale
      let mapHeight = map.logicalHalfSide * map.yratio * 2 / map.scale

      const sLeft = (-map.offset[0] - mapWidth) 
      const sRight = (-map.offset[0] + mapWidth) 
      const sTop = (-map.offset[1] - mapHeight) 
      const sBottom = (-map.offset[1] + mapHeight) 

      let aimIndex, boxIndex

      for(let aimIdString in aims) {
        let aimId = parseInt(aimIdString) // has to be a number
        aimIndex = aimIndexToId.length

        aim = aims[aimId]
        tr = aim.r

        left = aim.pos[0] - tr
        right = aim.pos[0] + tr
        top = aim.pos[1] - tr
        bottom = aim.pos[1] + tr

        if(
          left < sRight &&
          right > sLeft &&
          top < sBottom &&
          bottom > sTop
        ) {
          boxIndex = boxes.length
          relevantAims.add(aimIndex) 
          boxToAimIndex[boxIndex] = aimIndex
          tr *= outerMarginFactor
          boxes.push([aim.pos[0] - tr, aim.pos[1] - tr, aim.pos[0] + tr, aim.pos[1] + tr])
        }

        aimIdToIndex[aimId] = aimIndex
        aimIndexToId[aimIndex] = aimId 
        shifts.push(vec2.create())
        r.push(aim.r)
        pos.push(aim.pos)
      }


      let intersections = boxIntersect(boxes) 
      let iA, shiftA, rA, posA
      let iB, shiftB, rB, posB
      let ab, rSum, d

      for(let intersection of intersections) {
        iA = boxToAimIndex[intersection[0]]
        iB = boxToAimIndex[intersection[1]]
        shiftA = shifts[iA]
        rA = r[iA] 
        posA = pos[iA]
        shiftB = shifts[iB]
        rB = r[iB] 
        posB = pos[iB]

        ab = vec2.crSub(posB, posA) 
        rSum = rA + rB
        d = vec2.len(ab)


        if(d == 0) {
          const x = Math.random() * 2 - 1
          const y = Math.sqrt(1 - x * x) * (Math.random() > 0.5 ? 1 : -1)
          ab = vec2.fromValues(x * rSum, y * rSum)
        }
        if(d < rSum) {
          this.calcShiftAndApply(
            1, 0.9, 
            d, ab, 
            rA, rB, rSum, 
            shiftA, shiftB
          )
        } 
        if (d < rSum * outerMarginFactor) {
          this.calcShiftAndApply(
            outerMarginFactor, 0.09,
            d, ab, 
            rA, rB, rSum, 
            shiftA, shiftB
          )
        } 
      }

      let flows = toRaw(this.aimNetwork.flows) // benchmark proof this performance optimization

      for(let fromId in flows) {
        let bucket = flows[fromId]
        for(let intoId in bucket) {
          let flow = bucket[intoId]
          iA = aimIdToIndex[flow.from.id]
          iB = aimIdToIndex[flow.into.id]

          if(relevantAims.has(iA) || relevantAims.has(iB)) {
            shiftA = shifts[iA]
            rA = r[iA] 
            posA = pos[iA]
            shiftB = shifts[iB]
            rB = r[iB] 
            posB = pos[iB]

            ab = vec2.crSub(posB, posA) 
            rSum = rA + rB
            d = vec2.len(ab)

            // vec2.scale(ab, ab, 1 - rSum * outerMarginFactor / d) 

            if(d > rSum * outerMarginFactor * 1) {
              this.calcShiftAndApply(
                outerMarginFactor, 0.02,
                d - outerMarginFactor, ab, 
                rA, rB, rSum, 
                shiftA, shiftB
              )
            }
          }
        }
      }

      let minShift = 0.1 * (map.logicalHalfSide / map.halfSide) / map.scale
      let i
      for(let aimId in aims) {
        i = aimIdToIndex[aimId]
        const shift = shifts[i]
        if(shift[0] < -minShift ||
          shift[0] > minShift ||
          shift[1] < -minShift ||
          shift[1] > minShift) {
          aim = this.aimNetwork.aims[aimIndexToId[i]]
          if(
            !(aim == this.aimNetwork.selectedAim) &&
            !(aim == map.dragCandidate && map.dragBeginning)
          ) {
            aim.pos = vec2.crAdd(aim.pos, shift)
          }
        } 
      }
      requestAnimationFrame(() => {
        this.layout()
      })
    },
    calcShiftAndApply(
      marginFactor: number, 
      force: number, 
      d: number, 
      ab: vec2.T, 
      rA: number, 
      rB: number, 
      rSum: number,
      shiftA: vec2.T, 
      shiftB: vec2.T
    ) {
      const amount = (marginFactor - d / rSum) * force / rSum 

      vec2.scale(hShift, ab, -rB * amount) 
      vec2.add(shiftA, shiftA, hShift)

      vec2.scale(hShift, ab, +rA * amount) 
      vec2.add(shiftB, shiftB, hShift)
      
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.aim-map {
  position: absolute;
  left: 0; 
  top: 0; 
  width: 100vw;
  height:100vh; 
  background-color: shade(@bg1, 50%);  
}
</style>

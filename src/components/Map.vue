<template>
  <svg 
    ref="canvas"
    class='aim-map'
    :viewBox="viewBox">
    <g :transform="transform">
      <FlowSVG v-for="flow in flows" 
        :key="`${flow.from}x${flow.into}`"
        :flow="flow"/>
      <Connector 
        v-if="map.connectFrom !== undefined"
        :connectFrom="map.connectFrom"/>
      <AimSVG v-for="aim in aims" 
        :key="aim.id"
        :aim="aim"/>
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import AimSVG from './AimSVG.vue';
import FlowSVG from './FlowSVG.vue';
import Connector from './Connector.vue';

import { Aim, Flow, useAimNetwork } from '../stores/aim-network'
import { useMap } from '../stores/map'

import Vec2 from 'gl-vec2'
type V2 = number[]

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
      if(w < h) {
        this.map.clientOffset = Vec2.fromValues(
          0,
          (h - w) / 2
        )
        this.map.halfSide = w / 2
      } else {
        this.map.clientOffset = Vec2.fromValues(
          (w - h) / 2, 
          0 
        )
        this.map.halfSide = h / 2
      }
    }
    canvas.addEventListener("resize", updateHalfSide)
    updateHalfSide()

    const updatePan = (mouse: V2) => {
      const pb = this.map.panBeginning; 
      if(pb !== undefined) {
        const d = Vec2.clone(pb.page) 
        Vec2.sub(d, d, mouse) 
        if(Vec2.len(d) > 5) {
          this.map.preventReleaseClick = true
          Vec2.scale(d, d, this.map.logicalHalfSide / (this.map.halfSide * this.map.scale)) 
          const offset = Vec2.clone(pb.offset)
          Vec2.sub(offset, offset, d)
          this.map.offset = offset  
        }
      }
    }

    const updateDrag = (mouse: V2) => {
      const db = this.map.dragBeginning;
      const aim = this.map.dragCandidate; 
      if(db && aim) {
        const d = Vec2.clone(db.page)
        Vec2.sub(d, d, mouse) 
        if(Vec2.len(d) > 5) {
          this.map.preventReleaseClick = true
          Vec2.scale(d, d, this.map.logicalHalfSide / (this.map.halfSide * this.map.scale)) 
          const pos = Vec2.clone(db.pos)
          Vec2.sub(pos, pos, d) 
          aim.pos = pos
        }
      }
    }

    const beginPan = (mouse: V2) => {
      this.map.panBeginning = {
        page: Vec2.clone(mouse), 
        offset: Vec2.clone(this.map.offset)
      }
    }
    const beginDrag = (aim: Aim, mouse:V2) => {
      this.map.dragBeginning = {
        page: Vec2.clone(mouse),
        pos: Vec2.clone(aim.pos) 
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

    const updateWhatever = (mouse: V2) : void => {
      this.map.updateMouse(mouse)
      if(this.map.panBeginning) {
        updatePan(mouse); 
        console.log("updating pan") 
      } else if (this.map.dragBeginning) {
        updateDrag(mouse); 
      }
    }

    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      updateWhatever([e.clientX, e.clientY])
    })

    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      const mouse = Vec2.fromValues(e.clientX, e.clientY)
      if(this.map.connectFrom) {
        this.map.connecting = true
      } else if(this.map.dragCandidate) {
        beginDrag(this.map.dragCandidate, mouse)
      } else {
        beginPan(mouse) 
      }
    })

    canvas.addEventListener("mouseup", () => {
      endWhatever() 
    })

    canvas.addEventListener("wheel", (e: WheelEvent) => {
      const mouse = Vec2.fromValues(e.clientX, e.clientY)
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
      mLogical: V2, 
      distancePage: number, 
      offset: V2, 
      scale: number, 
    };
    canvas.addEventListener("touchstart", (e: TouchEvent) => { 
      e.preventDefault()
      if(e.touches.length > 0) {
        if(e.touches.length > 1) {
          // 2 or more touches         
          if(touch.currentCount < 2) {
            touch.currentCount = 2
            // page coordinates
            let firstPage = Vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
            let secondPage = Vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY)
            let mPhysical = Vec2.clone(firstPage) 
            Vec2.add(mPhysical, mPhysical, secondPage) 
            Vec2.scale(mPhysical, mPhysical, 0.5) 
            let mLogical = this.map.physicalToLogicalCoord(mPhysical) 
            // model/svg coordinates
            pinchBeginning = {
              first: e.touches[0].identifier, 
              second: e.touches[1].identifier, 
              mLogical, 
              distancePage: Vec2.dist(firstPage, secondPage), 
              offset: Vec2.clone(this.map.offset), 
              scale: this.map.scale
            }
          } 
        } else {
          // 1 touch
          if(touch.currentCount == 0) {
            // new touch 
            touch.currentCount = 1
            touch.dragFingerId = e.touches[0].identifier
            let mouse = Vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
            if(this.map.dragCandidate) {
              beginDrag(this.map.dragCandidate, mouse)
            } else {
              beginPan(mouse)
            }
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
        let mouse = Vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
        updateWhatever(mouse)
      } else if (touch.currentCount > 1) {
        if(pinchBeginning) {
          // update pinch
          const map = this.map

          let firstPage = Vec2.fromValues(e.touches[0].clientX, e.touches[0].clientY)
          let secondPage = Vec2.fromValues(e.touches[1].clientX, e.touches[1].clientY)
          let distancePage = Vec2.dist(firstPage, secondPage)

          let mPhysical = Vec2.clone(firstPage) 
          Vec2.add(mPhysical, mPhysical, secondPage) 
          Vec2.scale(mPhysical, mPhysical, 0.5) 
          let mLogical = this.map.physicalToLogicalCoord(mPhysical) 

          // 
          let scaleChange = distancePage / pinchBeginning.distancePage 
          map.scale = pinchBeginning.scale * scaleChange

          Vec2.sub(mLogical, mLogical, pinchBeginning.mLogical) 

          Vec2.add(this.map.offset, this.map.offset, mLogical) 
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
      this.aimNetwork.deselect()
    });
  }, 
  methods: {

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
      for(let fromId in this.aimNetwork.flows) {
        let intoFlows = this.aimNetwork.flows[fromId]
        for(let intoId in intoFlows) {
          flows.push(intoFlows[intoId]) 
        }
      }
      return flows; 
    }, 
    aims() : Aim[] {
      let aims = Object.values(this.aimNetwork.aims)
      let selectedAim = this.aimNetwork.selectedAim
      if(selectedAim) {
        aims = aims.filter(aim => aim !== selectedAim)
      }
      aims = aims.filter(aim => aim.subLevel < 0).concat(
        aims.filter(aim => aim.subLevel >= 0)
      )
      if(selectedAim) {
        aims.push(selectedAim)
      }
      return aims
    }, 
  },
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
  background-color: @bg1;  
}
</style>

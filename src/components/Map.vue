<template>
  <svg 
    ref="canvas"
    class='aim-map'
    viewBox="-1000 -1000 2000 2000">
    <g :transform="transform">
      <FlowSVG v-for="flow in flows" 
        :key="`${flow.from}x${flow.into}`"
        :flow="flow"/>
      <Connector 
        v-if="aimNetwork.connectFrom !== undefined"
        :connectFrom="aimNetwork.connectFrom"/>
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
      map: useMap()
    }
  }, 
  props: {
    msg: String,
  },
  mounted() {
    const canvas = this.$refs.canvas as SVGElement
    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      console.log("mouse moving!")
      updateWhatever([e.clientX, e.clientY])
    })

    const updatePan = (mouse: V2) => {
      const pb = this.map.panBeginning; 
      if(pb !== undefined) {
        const d = Vec2.clone(pb) 
        Vec2.sub(d, d, mouse) 
        if(Vec2.len(d) > 5) {
          this.map.preventReleaseClick = true
          const halfSide = Math.min(
            canvas.clientWidth,
            canvas.clientHeight
          ) / 2;
          const scale = this.map.scale; 
          Vec2.scale(d, d, 1 / (halfSide * scale)) 
          const offset = Vec2.clone(pb.offset)
          Vec2.add(offset, offset, d)
          this.map.offset = offset  
        }
      }
    }
    const updateDrag = (mouse: V2) => {
      console.log("update drag") 
      const db = this.map.dragBeginning;
      const aim = this.aimNetwork.dragCandidate; 
      if(db && aim) {
        const dx = db.page.x - x
        const dy = db.page.y - y
        if(dx * dx + dy * dy > 5 * 5) {
          this.map.preventReleaseClick = true
          const halfSide = Math.min(
            canvas.clientWidth, 
            canvas.clientHeight
          ) / 2;
          const scale = this.map.scale; 
          aim.x = db.initialPosition.x - dx / halfSide / scale; 
          aim.y = db.initialPosition.y - dy / halfSide / scale;
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
        offset: Vec2.clone(aim.pos) 
      }
    }

    const endWhatever = () : void => {
      if(this.map.panBeginning) {
        endPan(); 
      } else if (this.map.dragBeginning) {
        endDrag();
      }
    }

    const endPan = () => {
      delete this.map.panBeginning; 
    }

    const endDrag = () => {
      if(this.map.preventReleaseClick && this.aimNetwork.dragCandidate) {
        //TBD: this.aimNetwork.relocate()
      }
      delete this.map.dragBeginning; 
      delete this.aimNetwork.dragCandidate; 
    }


    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      if(this.aimNetwork.dragCandidate) {
        beginDrag(this.aimNetwork.dragCandidate, e.pageX, e.pageY)
      } else {
        beginPan(e.pageX, e.pageY) 
      }
    })

    canvas.addEventListener("mouseup", (e: MouseEvent) => {
      updateWhatever(e.pageX, e.pageY)
      endWhatever() 
    })

    canvas.addEventListener("wheel", (e: WheelEvent) => {
      const map = this.map
      const f = Math.pow(1.1, e.deltaY / 150)
      let mouseBefore = pageToSVGCoords(e.pageX, e.pageY, map.offset, map.scale)
      map.scale *= f
      let mouseAfter = pageToSVGCoords(e.pageX, e.pageY, map.offset, map.scale) 
      let delta = mouseAfter.clone().sub(mouseBefore)
      map.offset.sub(delta) 
    })

    canvas.addEventListener("touchstart", (e: TouchEvent) => { 
      if(e.touches.length > 0) {
        if(e.touches.length > 1) {
          // 2 or more touches         
          if(touchStuff.count < 2) {
            touchStuff.count = 2
            let offset = this.map.offset.clone()
            let scale = this.map.scale
            // page coordinates
            let firstPage = new Vector2(e.touches[0].pageX, e.touches[0].pageY)
            let secondPage = new Vector2(e.touches[1].pageX, e.touches[1].pageY)
            let distancePage = firstPage.distanceTo(secondPage)
            let middlePage = firstPage.add(secondPage).multiplyScalar(0.5)
            let middleSVG = pageToSVGCoords(middlePage.x, middlePage.y, offset, scale) 
            // model/svg coordinates
            pinchBeginning = {
              first: e.touches[0].identifier, 
              second: e.touches[1].identifier, 
              middleSVG, 
              distancePage, 
              offset, 
              scale 
            }
          } 
        } else {
          // 1 touch
          if(touchStuff.count == 0) {
            // new touch 
            touchStuff.count = 1
            touchStuff.dragFingerId = e.touches[0].identifier
            if(this.aimNetwork.dragCandidate) {
              beginDrag(this.aimNetwork.dragCandidate, e.touches[0].pageX, e.touches[0].pageY)
            } else {
              beginPan(e.touches[0].pageX, e.touches[0].pageY)
            }
          } else if (touchStuff.count > 1) {
            // from 2 or more to 1
            pinchBeginning = undefined // end pinch
          }
        }
      }
    });

    // const getTouch = (e: TouchEvent, identifier: number) : Touch | undefined => {
    //   for(let touch of e.touches) {
    //     if(touch.identifier == identifier) {
    //       return touch
    //     }
    //   }
    // }

    canvas.addEventListener("touchmove", (e: TouchEvent) => { 
      if(touchStuff.count == 1) {
        let touch = e.touches[0]
        updateWhatever(touch.pageX, touch.pageY)
      } else if (touchStuff.count > 1) {
        if(pinchBeginning) {
          // update pinch
          const map = this.map

          let first = e.touches[0] // getTouch(e, pinchBeginning.first)
          let second = e.touches[1] // getTouch(e, pinchBeginning.second)

          let firstPage = new Vector2(first.pageX, first.pageY)
          let secondPage = new Vector2(second.pageX, second.pageY)
          let distancePage = firstPage.distanceTo(secondPage)
          let middlePage = firstPage.add(secondPage).multiplyScalar(0.5)

          let scaleChange = distancePage / pinchBeginning.distancePage 


          map.scale = pinchBeginning.scale * scaleChange

          let middleSVG = pageToSVGCoords(
            middlePage.x, 
            middlePage.y, 
            pinchBeginning.offset, 
            map.scale
          ) 

          let delta = middleSVG.clone().sub(pinchBeginning.middleSVG)

          map.offset = pinchBeginning.offset.clone().sub(delta) 

            // const f = Math.pow(1.1, e.deltaY / 150)
            // let mouseBefore = pageToSVGCoords(e.pageX, e.pageY)
            // map.scale *= f
            // let mouseAfter = pageToSVGCoords(e.pageX, e.pageY) 
            // let delta = mouseAfter.clone().sub(mouseBefore)
            // map.offset.sub(delta) 
        }
      }
    })

    canvas.addEventListener("wheel", (e: WheelEvent) => {
      const map = this.map
      const f = Math.pow(1.1, e.deltaY / 150)
      let mouseBefore = pageToSVGCoords(e.pageX, e.pageY, map.offset, map.scale)
      map.scale *= f
      let mouseAfter = pageToSVGCoords(e.pageX, e.pageY, map.offset, map.scale) 
      let delta = mouseAfter.clone().sub(mouseBefore)
      map.offset.sub(delta) 
    })

    const finishTouch = () => {
      if(touchStuff.count == 1) {
        touchStuff.count = 0
        endWhatever()
      } else if (touchStuff.count == 2) {
        touchStuff.count = 0
      }
      this.map.preventReleaseClick = false // click not triggered after touch move
    }

    canvas.addEventListener("touchend", finishTouch) 
    canvas.addEventListener("touchcancel", finishTouch) 

    canvas.addEventListener("click", (e: MouseEvent) => {
      store.commit(
        MutationTypes.UPDATE_MOUSE_MAP_POSITION, 
        pageToSVGCoords(
          e.pageX, 
          e.pageY, 
          this.map.offset, 
          this.map.scale
        )
      )
      store.dispatch(ActionTypes.NOWHERE_CLICK)
    });

    const updateWhatever = (mouse: Vec2) : void => {
      map.updateMouse(mouse)
      if(map.panning !== undefined) {
        updatePan(x, y); 
      } else if (map.dragBeginning) {
        updateDrag(x, y); 
      }
    }
  }, 
  methods: {

  }, 
  computed: {
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
  setup() {
    const onMouseMove = () => {
    };
    window.addEventListener('mousemove', onMouseMove) 
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
  background-color: @bg1;  
}
</style>

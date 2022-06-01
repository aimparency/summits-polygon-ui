<template>
  <g class="aim"
    :style="{transform}">
    <g 
      :transform="scale">
      <circle 
        :class="{selected}"
        :fill="aim.color" 
        :data-aimid="aim.id"
        class="aim-circle" 
        cx="0" 
        cy="0" 
        r="1"
        @click.stop='select'
        @mousedown='mouseDown'
        @touchstart='mouseDown'
        @mouseup='mouseUp'
        @touchend='touchend'
      />
      <text
        dominant-baseline="central"
        text-anchor="middle"
        class="label"
        x="0"
        y="0">
        <tspan 
          x="0"
          :dy="i == 0 ? (-0.3 * (titleLines.length - 1) / 2) : 0.3 "
          v-for="line, i in titleLines" 
          :key="i"> {{ line }} </tspan>
      </text>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Aim, useAimNetwork } from '../stores/aim-network'
import { useMap } from '../stores/map';

export default defineComponent({
  name: 'AimSVG',
  data() {
    return {
      aimNetwork: useAimNetwork(),
      map: useMap()
    }
  },
  props: {
    aim: {
      type: Object as PropType<Aim>,
      required: true
    }
  }, 
  computed: {
    transform() : string {
      let aim = this.aim
      return `translate(${aim.pos[0]}px, ${aim.pos[1]}px)`
    }, 
    scale() : string {
      let aim = this.aim
      return `scale(${aim.importance})`
    }, 
    titleLines() : string[] {
      return this.aim.title
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line !== '')
    }, 
    selected() : boolean {
      return this.aimNetwork.selectedAim == this.aim; 
    }, 
    showTools() : boolean {
      return this.selected && this.map.connectFrom == undefined; 
    }, 
  },
  methods: {
    select() {
      if(!this.map.preventReleaseClick) {
        this.aimNetwork.selectAim(this.aim)
      }
    }, 
    mouseDown() {
      if(this.selected) {
        this.map.startConnecting(this.aim)
      } else {
        this.map.startDragging(this.aim)
      }
    }, 
    mouseUp() {
      if(this.map.connectFrom && this.map.connecting) {
        this.aimNetwork.createAndSelectFlow(this.map.connectFrom, this.aim) 
      }
    }, 
    touchend(e: TouchEvent) {
      if(this.map.connectFrom && this.map.connecting) {
        var changedTouches = e.changedTouches;
        const el = document.elementFromPoint(changedTouches[0].clientX, changedTouches[0].clientY)
        if(el && el.classList.contains("aim-circle")) {
          let aimCircle = el as SVGCircleElement
          let connectTo = this.aimNetwork.aims[aimCircle.dataset.aimid!]
          if(connectTo) {
            this.aimNetwork.createAndSelectFlow(this.map.connectFrom, connectTo) 
          }
        }
      }
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.aim {
  font-family: monospace; 
  circle {
    cursor: pointer; 
    transition: stroke-dasharray;  
    stroke-width: 0.075;
    &.selected {
      stroke: #ccc; 
    }
  }
  text{
    fill: #fff; 
    user-select: none; 
    pointer-events: none; 
    &.label{
      font-size: 0.25px;
      font-family: monospace;
    }
  }
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 0, 3.141;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 3.141 / 2, 3.141 / 2;
    stroke-dashoffset: -3.141 / 2;
  }
  100% {
    stroke-dasharray: 0, 3.141;
    stroke-dashoffset: -3.141 * 2;
  }
}
</style>

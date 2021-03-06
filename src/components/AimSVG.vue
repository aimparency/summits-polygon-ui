<template>
  <g class="aim"
    :style="{transform}">
    <g 
      :transform="scale">
      <circle 
        :class="{selected, loading}"
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
      <circle v-if='!published'
        class="unpublished-overlay"
        cx="0"
        cy="0"
        r="1"
        fill="url(#unpublished)"
      />
      <text
        dominant-baseline="central"
        text-anchor="middle"
        class="label"
        x="0"
        y="0">
        <!--(debug, see what's being redrawn) tspan :dy="-0.5"> {{ Date.now() }} </tspan-->
        <tspan 
          :dy="i == 0 ? (-0.3 * (titleLines.length - 1) / 2) : 0.3 "
          x="0"
          v-for="line, i in titleLines" 
          :key="i"> {{ line }} </tspan>
      </text>
      <g v-if='selected'>
        <g v-if="published"
          transform="translate(-1, -1) scale(0.2)">
          <circle 
            class="button"
            @click.stop="togglePin"
            r="1.3" fill="#379"
            />
          <image 
            class="icon"
            x="-1" y="-1" 
            width="2" height="2" 
            :href="aim.pinned ? 'pinned.svg' : 'pin.svg'" />
        </g>
      </g>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Aim, useAimNetwork } from '../stores/aim-network'
import { useMap } from '../stores/map';
import { useUi} from '../stores/ui';

export default defineComponent({
  name: 'AimSVG',
  data() {
    return {
      aimNetwork: useAimNetwork(),
      ui: useUi(), 
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
      return `scale(${aim.r})`
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
    loading() : boolean {
      return this.aim.pendingTransactions > 0 
    }, 
    published() : boolean {
      return this.aim.address !== undefined
    },
    showTools() : boolean {
      return this.selected && this.map.connectFrom == undefined; 
    }, 
  },
  methods: {
    select() {
      if(this.aimNetwork.selectedAim === this.aim) {
        this.ui.sideMenuOpen = true
      } else if(!this.map.preventReleaseClick) {
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
      console.log("touch end") 
      if(this.map.connectFrom && this.map.connecting) {
        var changedTouches = e.changedTouches;
        const el = document.elementFromPoint(changedTouches[0].clientX, changedTouches[0].clientY)
        console.log("end el", el) 
        if(el && el.classList.contains("aim-circle")) {
          let aimIdString = (el as SVGCircleElement).dataset.aimid
          console.log("aim id string", aimIdString) 
          if(aimIdString) {
            let connectTo = this.aimNetwork.aims[parseInt(aimIdString)]
            if(connectTo) {
              this.aimNetwork.createAndSelectFlow(this.map.connectFrom, connectTo) 
            }
          }
        }
      }
    },
    togglePin() {
      this.aimNetwork.togglePin(this.aim) 
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.aim {
  font-family: monospace; 
  .aim-circle {
    cursor: pointer; 
    transition: stroke-dasharray;  
    stroke-width: 0.075;
    &.selected {
      stroke: #ccc; 
    }
    &.loading {
      stroke: #ccc; 
      animation: dash 1.5s linear infinite;
      stroke-linecap: round;
    }
  }
  .unpublished-overlay {
    pointer-events: none; 
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
  .icon {
    pointer-events: none; 
  }
  .button {
    opacity: 0.7; 
    &:hover {
      opacity: 1; 
    }
  }
}

/*
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
*/

@keyframes dash {
  0% {
    stroke-dasharray: 0.1, 3.041;
    stroke-dashoffset: 0;
  }
  33% {
    stroke-dasharray: 1.5705, 1.5705;
    stroke-dashoffset: -1.5705;
  }
  100% {
    stroke-dasharray: 0.1, 3.041; 
    stroke-dashoffset: -3.141 * 2;
  }
}
</style>

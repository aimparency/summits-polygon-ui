<template>
  <path class="flow"
    :class="{selected}" 
    :fill="fillColor"
    :d="path"
    @click.stop="select"
  />
</template>

<script lang="ts">
// import Color from 'color'
import { defineComponent, PropType } from 'vue';

import makeCircularPath from '../make-circular-path';
import { Flow, useAimNetwork } from '../stores/aim-network';

export default defineComponent({
  name: 'AimSVG',
  props: {
    flow: {
      type: Object as PropType<Flow>,
      required: true
    }
  }, 
  data() {
    return {
      aimNetwork: useAimNetwork()
    }
  }, 
  computed: {
    selected() : boolean {
      return this.flow == this.aimNetwork.selectedFlow;
    }, 
    fillColor() : string {
      let hex = ''
      const selectedAim = this.aimNetwork.selectedAim;
      if ( selectedAim && selectedAim.id == this.flow.from) {
        hex = "eeeeee"
      } else {
        let from = this.aimNetwork.aims[this.flow.from]
        if(from) {
          hex = from.color
        } else {
          hex = "555555"
        }
      }
      return "#" + hex
    }, 
    path() : string {
      const from = this.aimNetwork.aims[this.flow.from]
      const into = this.aimNetwork.aims[this.flow.into]
      return makeCircularPath(
        {x: from.x, y: from.y, r: from.importance}, 
        this.flow.share, 
        {x: into.x, y: into.y, r: into.importance}
      ) 
    }, 
  },
  methods: {
    select() {
      this.aimNetwork.selectFlow(this.flow) 
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.flow {
  stroke: none;
  opacity: 0.7; 
  &.selected {
    fill: #ccc; 
  }
  cursor: pointer; 
}
</style>

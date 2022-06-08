<template>
  <path class="flow"
    :class="{selected, aimSelected}" 
    :fill="fillColor"
    :d="path"
    :stroke-width="strokeWidth"
    @click.stop="select"
  />
</template>

<script lang="ts">
// import Color from 'color'
import { defineComponent, PropType } from 'vue';

import makeCircularPath from '../make-circular-path';
import { Flow, useAimNetwork } from '../stores/aim-network';

export default defineComponent({
  name: 'FlowSVG',
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
    aimSelected() : boolean {
      return this.flow.from == this.aimNetwork.selectedAim ||
        this.flow.into == this.aimNetwork.selectedAim;
    }, 
    strokeWidth() : number {
      return 0.07 * this.flow.from.importance
    }, 
    fillColor() : string {
      return this.flow.from.color
    }, 
    path() : string {
      const from = this.flow.from
      const into = this.flow.into
      return makeCircularPath(
        {pos: from.pos, r: from.importance}, 
        this.flow.share, 
        {pos: into.pos, r: into.importance}
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
  opacity: 0.5; 
  mix-blend-mode: lighten; 
  &.selected {
    stroke: #fff; 
    opacity: 0.8; 
  }
  &.aimSelected {
    opacity: 0.8; 
  }
  cursor: pointer; 
}
</style>

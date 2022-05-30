<template>
  <path
    class="connector"
    fill="white"
    :d="path"
    :stroke-width="connectFrom.importance * 100"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import makeCircularPath from '../make-circular-path';
import { Aim } from '../stores/aim-network';
import { useMap } from '../stores/map';

export default defineComponent({
  name: 'NodeTools',
  emits: [
    'startMove', 
    'stopMove'
  ], 
  data() {
    return {
      map: useMap()
    }
  },
  props: {
    connectFrom: {
      type: Object as PropType<Aim>,
      required: true
    }
  },
  computed: {
    path() : string {
      return makeCircularPath(
        {
          x: this.connectFrom.x, 
          y: this.connectFrom.y, 
          r: this.connectFrom.importance
        }, 
        0.1, 
        {
          x: this.map.mouse.logical[0],		
          y: this.map.mouse.logical[1],		
          r: 0
        }
      )
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.connector{
  fill: #bbb; 
  stroke: none; 
}
</style>

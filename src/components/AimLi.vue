<template>
  <div class="aim-li"> 
    {{ aim.title }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"

import { Aim } from "../stores/aim-network"

export default defineComponent({
  name: "AimLi",
  components: {
  },
  props: {
    aim: {
      type: Object as PropType<Aim>,
      required: true
    }
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.aim-li{
  padding: 0.3rem; 
  margin: 0 0.5rem; 
  border-top: 0.2rem solid #fff6; 
  background-color: #fff2; 
  &:focus{
    outline: none; 
  background-color: #fff6; 
  }
}
</style>

<template>
  <div class="aim-li"> 
    {{ aim.title || '<unnamed>' }}
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
  .clickable();
  padding: 0.3rem 1rem; 
  margin: 0 ;
  border-top: 0.2rem solid @mid1; 
  background-color: @bg1;  
  &:focus{
    outline: none; 
    background-color: @mid1; 
  }
  @r: @secondaryradius; 
  &:first-child{
    border-top-left-radius: @r; 
    border-top-right-radius: @r;
    border: none; 
  }
  &:last-child{
    border-bottom-left-radius: @r;
    border-bottom-right-radius: @r;
  }
}
</style>

<template>
  <div class="aim-map"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AimMap",
  props: {
    msg: String,
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
  width: 100%;
  height: 100%; 
  background-color: @bg1;  
}
</style>

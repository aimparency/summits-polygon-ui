<template>
  <div class="back"
    tabindes="0"
    @click.stop="$emit('click')">
    &#129144;
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "AimLi",
  emits: ['click'],
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
@size: 3rem; 
.back{
  .button();
  margin:0; 
  padding: 0; 
  left: 0.5rem;
  top: 0.5rem; 
  font-size: 1.8rem; 
  width: @size; 
  height: @size; 
  line-height: @size; 
  font-weight: bold; 
  text-align: center; 
  position: absolute; 
}
</style>

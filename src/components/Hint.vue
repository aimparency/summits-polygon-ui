<template>
  <div class="hint" v-if="ui.hint !== undefined"
    tabindes="0"
    :style="style"
    @click.stop="closeHint">
    {{ ui.hint.message }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

import { useUi } from "../stores/ui"

export default defineComponent({
  name: "Hint",
  data() {
    return {
      ui: useUi()
    }
  }, 
  computed: {
    style() {
      let hint = this.ui.hint
      if(hint !== undefined) {
        let corner = "border-"
        let style = {} as any
        if(hint.position[1] > this.ui.screenSize[1]) {
          style.bottom = this.ui.screenSize[1] - hint.position[0] + "px"
          corner += "bottom"
        } else {
          style.top = hint.position[1] + "px"
          corner += "top"
        }
        corner += "-"
        if(hint.position[0] > this.ui.screenSize[0]) {
          style.right = this.ui.screenSize[0] - hint.position[0] + "px"
          corner += "right" 
        } else {
          style.left = hint.position[0] + "px"
          corner += "left"
        }
        corner += "-radius"
        style[corner] = "0"
        style['background-color'] = hint.color
        return style
      } else {
        return {}
      }
    }
  },
  methods: {
    closeHint() {
      this.ui.closeHint()
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.hint{
  position: fixed; 
  z-index: 100;
  width: 33%; 
  box-sizing: border-box;
  padding: 0.5rem;
  opacity: 0.8; 
  color: white; 
  border-radius: 1rem; 
  border: 0.1rem solid #fff6; 
  cursor: pointer; 
}
</style>

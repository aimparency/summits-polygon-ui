<template>
  <div class="side-bar" :class="{closed: !open}" :style="style"> 
    <div class="toggle"
      @click.stop="toggle">
      <span v-if="open">
        &lt; 
      </span>
      <span v-else>
        &gt; 
      </span>
    </div>
    <aimDetails 
      v-if="ui.view == 'aimDetails' && (aimNetwork.selectedAim !== undefined)"
      :aim="aimNetwork.selectedAim"
      />
    <LocalList v-else/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

import { useUi } from "../stores/ui"
import { Aim, useAimNetwork } from "../stores/aim-network"

import LocalList from "./LocalList.vue"
import AimDetails from "./AimDetails.vue"

export default defineComponent({
  name: "SideBar",
  components: {
    LocalList, 
    AimDetails, 
  },
  props: {
    msg: String,
  },
  setup() {
    return { 
      ui: useUi(),
      aimNetwork: useAimNetwork()
    }
  }, 
  data() {
  },
  computed: {
    style() {
      const screenSize = this.ui.$state.screenSize
      const portrait = screenSize[0] > screenSize[1]
      let width = 0
      if(!portrait) {
        width = 100
      } else {
        width = Math.max(50 * screenSize[1] / screenSize[0], 20) 
      }
      return {
        width: width + "%"
      }
    },
    open() : boolean {
      return this.ui.$state.sideMenuOpen
    }
  }, 
  methods: {
    toggle() {
      this.ui.toggleSideMenu()
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.side-bar {
  position: fixed; 
  left: 0; 
  top: 0; 
  background-color: @bg2;
  height: 100%; 
  transform: translate(0, 0); 
  box-shadow: 0 0 2rem black; 
  &.closed{
    box-shadow: none; 
    transform: translate(-100%, 0); 
    .toggle {
      box-shadow: 0 0 2rem black; 
    }
  }
  .toggle {
    @size: 3rem; 
    font-size: 1.8rem; 
    .clickable(); 
    background-color: @bg2; 
    border-bottom-right-radius: @secondaryround; 
    width: @size - 0.5rem; 
    height: @size; 
    line-height: @size; 
    font-weight: bold; 
    text-align: center; 
    position: absolute; 
    left: 100%; 
    top: 0; 
    border-left: none; 
  }
  transition: transform 0.15s ease-in-out;
}
</style>

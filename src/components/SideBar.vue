<template>
  <div 
    class="side-bar" 
    :class="{closed: !open}" 
    :style="style"> 
    <div class="container">
      <AimDetails 
        v-if="aimNetwork.selectedAim"
        :aim="aimNetwork.selectedAim"
        />
      <FlowDetails
        v-else-if="aimNetwork.selectedFlow"
        :flow="aimNetwork.selectedFlow"
        />
      <LocalList v-else/>
    </div>
    <div class="toggle"
      tabindes="0"
      @click.stop="toggle">
      <span v-if="open">
        &lt; 
      </span>
      <span v-else>
        &gt; 
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

import { useUi } from "../stores/ui"
import { useAimNetwork } from "../stores/aim-network"

import LocalList from "./LocalList.vue"
import AimDetails from "./AimDetails.vue"
import FlowDetails from "./FlowDetails.vue"

export default defineComponent({
  name: "SideBar",
  components: {
    LocalList, 
    AimDetails, 
    FlowDetails, 
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
    return {}
  },
  computed: {
    showAimDetails() {
      return this.aimNetwork.selectedAim !== undefined
    }, 
    showBackButton() {
      return this.showAimDetails
    },
    style() {
      const screenSize = this.ui.screenSize
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
      return this.ui.sideMenuOpen
    }
  }, 
  methods: {
    toggle() {
      this.ui.toggleSideMenu()
    }, 
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
@size: 3rem; 
.side-bar {
  position: fixed; 
  left: 0; 
  top: 0; 
  background-color: @bg2;
  height: 100%; 
  transform: translate(0, 0); 
  box-shadow: 0 0 4rem black; 
  &.closed{
    box-shadow: none; 
    transform: translate(-100%, 0); 
    .toggle {
      box-shadow: 0 0 2rem black; 
      left: 100%; 
    }
  }
  .container {
    overflow-y: auto;
    overflow-y: overlay;
    height: 100%; 
  }
  .toggle {
    left: calc(100% - @size);
    font-size: 1.8rem; 
    .clickable(); 
    background-color: @mid2; 
    border-bottom-right-radius: @secondaryradius; 
    width: @size; 
    height: @size; 
    line-height: @size; 
    font-weight: bold; 
    text-align: center; 
    position: absolute; 
    top: 0; 
    transition: left 0.2s ease-out; 
  }
  transition: transform 0.2s ease-out;
}
</style>

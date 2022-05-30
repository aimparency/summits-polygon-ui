<template>
  <div 
    class="side-bar" 
    :class="{closed: !open}" 
    :style="style"> 
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
    <div class="back"
      v-if="ui.view != 'localList'"
      tabindes="0"
      @click.stop="goBack">
      &lt;-
      
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
    return {}
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
    }, 
    goBack() {
      this.ui.goBack()
    }
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
    transition: left 0.3 ease-out; 
  }
  .back{
    .button();
    margin:0; 
    padding: 0; 
    left: 0;
    font-size: 1.8rem; 
    width: @size; 
    height: @size; 
    line-height: @size; 
    font-weight: bold; 
    text-align: center; 
    position: absolute; 
    top: 0; 
  }
  transition: transform 0.15s ease-out;
}
</style>

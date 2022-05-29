<template>
  <div class="local-list"> 
    <input type="text" placeholder="filter..."/>
    <div class="buttonList">
      <div tabindex="0" class="button" 
        @keypress=""
        @keyup.enter="addAim"
        @click.stop="addAim">
        Add aim ...
      </div>
      <div tabindex="0" class="button" 
        @keyup.enter="switchToGlobalSearch"
        @click.stop="switchToGlobalSearch">
        Search globally ...
      </div>
    <AimLi tabindex="0"
      v-for="aim in aims"
      :key="aim.id"
      :aim="aim"/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

import { useUi } from "../stores/ui"
import { useAimNetwork } from "../stores/aim-network"

import AimLi from "./AimLi.vue"

export default defineComponent({
  name: "LocalList",
  components: {
    AimLi
  },
  props: {
    msg: String,
  },
  setup() {
    return { 
      aimNetwork: useAimNetwork(),
      ui: useUi()
    }
  }, 
  data() {
  }, 
  computed: {
    aims() {
      // TBD filter
      return this.aimNetwork.$state.aims
    }
  }, 
  methods: {
    switchToGlobalSearch() {
      //TBD
    }, 
    addAim() {
      this.aimNetwork.createAim()
      this.ui.showAimDetails()
    }
  }, 
  
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.local-list {
  .buttonList {
    margin: 0.5rem; 
  }
}
</style>

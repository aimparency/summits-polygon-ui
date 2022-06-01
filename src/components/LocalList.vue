<template>
  <div class="local-list"> 
    <h2 class="sidebar-heading">all aims</h2>
    <input type="text" placeholder="filter..."/>
    <div class="buttonList">
      <div tabindex="0" class="button" 
        @keypress.enter="addAim"
        @click.stop="addAim">
        Add aim ...
      </div>
      <div tabindex="0" class="button" 
        @keyup.enter="switchToGlobalSearch"
        @click.stop="switchToGlobalSearch">
        Search globally ...
      </div>
    </div>
    <div class="results">
      <AimLi tabindex="0"
        v-for="aim in aims"
        :key="aim.id"
        :aim="aim"
        @click="selectAim(aim)"
        @keypress.space="selectAim(aim)"
        @keypress.enter="selectAim(aim)"
        />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

import { useUi } from "../stores/ui"
import { Aim, useAimNetwork } from "../stores/aim-network"

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
    return {}
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
      this.aimNetwork.createAndSelectAim()
    }, 
    selectAim(aim: Aim) {
      this.aimNetwork.selectAim(aim)
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
  .results {
    margin: 1rem 0.5rem; 
    padding: 0; 
  }
}
</style>

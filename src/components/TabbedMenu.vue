<template>
  <div class="head">
    <span class='tab'
      v-for="tab, key in ui.tabs" :key="key"
      tabindex=0
      @keydown.enter.prevent.stop="ui.openTab = tab"
      @keydown.space.prevent.stop="ui.openTab = tab"
      @click="ui.openTab = tab"
      :class="{active: tab == ui.openTab}"
      >
      {{ tab }}
    </span>
  </div>
  <LocalList v-if="ui.openTab == 'aims'"/>
  <UncommittedChanges v-if="ui.openTab == 'changes'"/>
</template>

<script lang="ts">
import { defineComponent } from "vue"

import LocalList from "./LocalList.vue"
import UncommittedChanges from "./UncommittedChanges.vue"

import { useUi } from "../stores/ui.ts"

export default defineComponent({
  name: "TabbedMenu",
  components: {
    LocalList, 
    UncommittedChanges
  },
  setup() {
    return { 
      ui: useUi(),
    }
  }, 
  data() {
    return {}
  },
  computed: {
  }, 
  methods: {
  }
});
</script>

<style scoped lang="less">
.head{
  background-color: shade(@bg2, 50%); 
  height: 5rem; 
  .tab {
    font-size: 1.2rem; 
    font-weight: bold; 
    padding: 1rem;
    border-top-left-radius: 1rem; 
    border-top-right-radius: 1rem; 
    line-height: 1rem; 
    margin-top: 2rem;
    background-color: shade(@bg2, 25%); 
    cursor:pointer; 
    display: inline-block; 
    color: #ccc; 
    &.active {
      color: white; 
      background-color: @bg2; 
    }
    &:hover {
      background-color: shade(@c2, 50%); 
    }
  }
  margin-bottom: 1rem;
}
</style>

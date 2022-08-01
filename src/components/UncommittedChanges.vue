<template>
  <div class="changeList">
    <div v-for="change in changes">
      <div
        class="aimButton"
        :class="{disabled: change.aimChanges.length == 0}"
        tabindex="0"
        :key="change.aim.id"
        :aim="change.aim"
        @click="change.aimChanges.length > 0 && selectAim(change.aim)"
        @keypress.space="change.aimChanges.length > 0 && selectAim(change.aim)"
        @keypress.enter="change.aimChanges.length > 0 && selectAim(change.aim)"
      > {{ change.aim.title }} </div>: 
      <span v-if="change.aimChanges.length == 0"> no aim changes </span>
      <template v-else>
        <span 
          class="aimChange"
          v-for="type in change.aimChanges">
          {{ type }}
        </span>
      </template>
      <template v-if="change.changedFlows.length > 0">
        <br/>
        <div 
          v-for="flow in change.changedFlows"
          class="flowButton"
          @click="change.aimChanges.length > 0 && selectFlow(change.aim)"
          @keypress.space="change.aimChanges.length > 0 && selectFlow(change.aim)"
          @keypress.enter="change.aimChanges.length > 0 && selectFlow(change.aim)">
          --> {{flow.into.title }}
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Aim, Flow, useAimNetwork } from '../stores/aim-network'
import { useMap } from "../stores/map"

import AimLi from './AimLi.vue'

interface Change {
  aim: Aim
  aimChanges: string[]
  changedFlows: Flow[]
}

export default defineComponent({
  name: "UncommittedChanges",
  components: {
    AimLi
  }, 
  setup() {
    return { 
      aimNetwork: useAimNetwork(), 
      map: useMap()
    }
  }, 
  data() {
    return {}
  },
  computed: {
    changes() {
      let results: Change[] = []
      let aimIds = Object.keys(this.aimNetwork.aims) as any as number[]
      for(let aimId in aimIds) {
        let aim = this.aimNetwork.aims[aimId]
        let aimChanges = []
        if(Object.keys(aim.origin).find(key => (aim.origin as any)[key] !== undefined)) {
          aimChanges.push("data") 
        } 
        if(aim.tokens != aim.tokensOnChain) {
          aimChanges.push("investment") 
        } 
        if(aim.members.find(m => m.changed)) {
          aimChanges.push("permissions") 
        }
        if(aim.loopWeightOrigin !== undefined) {
          aimChanges.push("loop weight") 
        }
        if(aim.contributionConfirmationSwitches.size !== 0) {
          aimChanges.push("contribution confirmations")
        }
        let changedFlows: Flow[] = []
        for(let flowId in aim.inflows) {
          let flow = aim.inflows[flowId]
          if(Object.keys(flow.origin).find(key => (flow.origin as any)[key] !== undefined)) {
            changedFlows.push(flow) 
          } 
        }
        if(aimChanges.length > 0 || changedFlows.length > 0) {
          results.push({
            aim, 
            aimChanges, 
            changedFlows, 
          })
        }
      }
      return results
    }
  }, 
  methods: {
    selectAim(aim: Aim) {
      this.aimNetwork.selectAim(aim)
      this.map.centerOnAim(aim) 
    },
    selectFlow(flow: Flow) {
      this.aimNetwork.selectFlow(flow)
      this.map.centerOnAim(flow.from) 
    },
  }
});
</script>

<style scoped lang="less">
.flowButton{
  .button(); 
  &.disabled {
    background-color: #aaa; 
    cursor: default; 
  }
}
.aimButton {
  .button(); 
  &.disabled {
    background-color: #aaa; 
    cursor: default; 
  }
}
.aimChange{
  margin: 0.2rem; 
  padding: 0.2rem; 
  border-radius:0.2rem; 
  background-color: #8888; 
}
</style>

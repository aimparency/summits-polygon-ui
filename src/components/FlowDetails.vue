<template>
  <div 
    class="flow-details"> 
    <h2 class="sidebar-heading">flow details</h2>
    <!-- TBD details (cid) -->
    <div class='aims'>
      <div
        tabindex="0"
        @click='aimNetwork.selectAim(flow.from)'
        class='button'> 
        {{ flow.from.title || "<unnamed>" }} 
      </div>
      contributes to
      <div
        tabindex="0"
        @click='aimNetwork.selectAim(flow.into)'
        class='button'> 
        {{ flow.into.title || "<unnamed>"}} 
      </div>
    </div>
    <Slider
      name='weight'
      left='0'
      right='100'
      :factor="100/0xffff"
      :decimalPlaces='2'
      :from='0'
      :to='0xffff'
      :value='flow.weight'
      @update='updateShare'/>
    <div v-if="flow.pendingTransactions"> 
      <div class="spinner"></div>
    </div>
    <div v-else>
      <span v-if='dirty'>
        <div class='button' tabindex="0" v-if='dirty' @click="reset">reset</div>
        <div class='button' tabindex="0" v-if='dirty' @click="commit">commit</div>
      </span>
      <div
        tabindex="0"  
        class='button' 
        :class='{confirm: confirmRemove}'
        @blur='confirmRemove = false'
        @click="remove">{{ confirmRemove ? "confirm removal" : "remove" }}</div>
    </div>
    <div class="scrollspace"></div>
    <BackButton @click="aimNetwork.deselect"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"

import { useUi } from "../stores/ui"
import { Flow, useAimNetwork } from "../stores/aim-network"

import AimLi from "./AimLi.vue"
import MultiSwitch from './MultiSwitch.vue'
import Slider from './Slider.vue'
import BackButton from './SideBar/BackButton.vue'

export default defineComponent({
  name: "FlowDetails",
  components: {
    AimLi,
    MultiSwitch,
    Slider, 
    BackButton,
  },
  props: {
    flow: {
      type: Object as PropType<Flow>,
      required: true
    }
  },
  data() {
    const aimNetwork = useAimNetwork()
    const ui = useUi()
    return { 
      aimNetwork, 
      ui, 
      confirmRemove: false, 
    }
  }, 
  computed: {
    dirty() : boolean {
      return !this.flow.published
    }, 
  }, 
  methods: {
    keypress(e: KeyboardEvent) {
      if(e.key == 'Enter' && this.dirty) {
        this.commit()
      } 
    }, 
    updateShare(v: number) {
      this.flow.setWeight(v)
    }, 
    reset() {
      this.aimNetwork.resetFlowChanges(this.flow)
    }, 
    commit() {
      if(this.flow.published) {
        this.aimNetwork.commitFlowChanges(this.flow) 
      } else {
        this.aimNetwork.createFlowOnChain(this.flow) 
      }
    }, 
    flowClick(flow: Flow) {
      this.aimNetwork.selectFlow(flow)
    }, 
    remove() {
      if(!this.confirmRemove) {
        this.confirmRemove = true
      } else {
        this.aimNetwork.removeFlow(this.flow)
      }
    }
  }, 
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.flow-details{
  text-align: center; 
  .aims {
    margin: 1rem; 
  }
  .button {
    &.confirm {
      background-color: @danger; 
    }
  }
  textarea {
    height: 10em; 
  }
}

</style>

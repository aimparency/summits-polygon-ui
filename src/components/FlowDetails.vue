<template>
  <div 
    class="flow-details"> 
    <h3>flow details</h3>
    <!-- TBD details (cid) -->
    <textarea
      ref='explanation'
      rows="9"
      placeholder="flow explanation"
      :value="flow.explanation"
      @input="updateExplanation"></textarea>
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
      @update='updateWeight'/>
    <div v-if="flow.pendingTransactions"> 
      <div class="spinner"></div>
    </div>
    <div v-else>
      <span v-if='!flow.published'>
        <p v-if='flow.into.address == undefined || flow.from.address == undefined'>
          Before creating this flow on chain, both involved aims have to be created on chain</p>
        <div v-else class='button' tabindex="0" @click="create">create flow on chain</div>
      </span>
      <span v-else-if='dirty'>
        <div class='button' tabindex="0" v-if='dirty' @click="reset">reset</div>
        <div class='button' tabindex="0" v-if='dirty' @click="commit">commit changes</div>
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
      return ( 
        Object.values(this.flow.origin).filter((v: any) => v !== undefined).length > 0 
      ) 
    }, 
  }, 
  methods: {
    updateWeight(v: number) {
      this.flow.updateWeight(v)
    }, 
    reset() {
      this.aimNetwork.resetFlowChanges(this.flow)
    }, 
    commit() {
      this.aimNetwork.commitFlowChanges(this.flow) 
    }, 
    create() {
      this.aimNetwork.createFlowOnChain(this.flow) 
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
    },
    updateExplanation(e: Event) {
      const v = (<HTMLTextAreaElement>e.target).value
      this.flow.updateExplanation(v)
    }, 
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

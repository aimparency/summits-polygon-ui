<template>
  <div class="aim-details"> 
    <h2 class="sidebar-heading">aim details</h2>
    <input 
      ref='title'
      class='standard title' 
      :value="aim.title" 
      placeholder="<aim title>"
      @input="updateTitle"/>
    <input 
      class='standard effort' 
      :value="effortString ?? aim.effort.humanize()" 
      @blur='parseAndUpdateEffort'
      onfocus="this.select()" 
      @input="effortChange"/>
    <MultiSwitch
      class='state'
      label="state"
      :value="aim.state"
      :options="stateOptions" 
      @change='updateState'
      />
    <IntSlider 
      name='shares'
      :left='sharesSliderMin.toString()'
      :right='sharesSliderMax.toString()'
      :from='sharesSliderMin'
      :to='sharesSliderMax'
      :value='aim.shares'
      @drag-end='updateSharesSliderOrigin'
      @update='updateShares'/>
    <div v-if="aim.pendingTransactions"> 
      <div class="spinner"></div>
    </div>
    <div v-else>
      <span v-if='dirty'>
        <div class='button' v-if='dirty' @click="reset">reset</div>
        <div class='button' v-if='dirty' @click="commit">commit</div>
      </span>
      <div 
        class='button' 
        :class='{confirm: confirmRemove}'
        @blur='confirmRemove = false'
        @click="remove">{{ confirmRemove ? "confirm removal" : "remove" }}</div>
    </div>
    <h3 v-if="flows_from.length > 0"> incoming flows </h3>
    <div 
      class="flow" 
      v-for="pair, i in flows_from" 
      @click="flowClick(pair.flow)" 
      :key="i">
      {{ pair.aim.title || "<unnamed>"}} <br/>
      share: {{ pair.flow.share }}
    </div>
    <h3 v-if="flows_into.length > 0"> outgoing flows </h3>
    <div 
      class="flow" 
      v-for="pair, i in flows_into" 
      @click="flowClick(pair.flow)" 
      :key="i">
      {{ pair.aim.title || "<unnamed>"}} <br/>
      share: {{ pair.flow.share }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"

import { useUi } from "../stores/ui"
import { Aim, AimOrigin, Flow, useAimNetwork } from "../stores/aim-network"
import Effort from "../types/effort"

import AimLi from "./AimLi.vue"
import MultiSwitch from './MultiSwitch.vue'
import IntSlider from './IntSlider.vue'

export default defineComponent({
  name: "AimDetails",
  components: {
    AimLi,
    MultiSwitch,
    IntSlider: IntSlider, 
  },
  props: {
    aim: {
      type: Object as PropType<Aim>,
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
      effortString: undefined as string | undefined,
      sharesSliderOrigin: 0, 
      stateOptions: [
        {
          value: "open", 
          color: "#288"
        }, 
        {
          value: "in progress", 
          color: "#a74", 
        }, 
        { 
          value: "submitted", 
          color: "#56b", 
        }
      ]
    }
  }, 
  mounted() {
    this.updateSharesSliderOrigin()
  },
  computed: {
    dirty() : boolean {
      return ( 
        Object.keys(this.aim.origin).length > 0 
      ) 
    }, 
    sharesSliderMin(): number {
      return Math.round(
        Math.max(0, this.sharesSliderOrigin / 2 - 10)
      )
    }, 
    sharesSliderMax(): number {
      return Math.round(
        this.sharesSliderOrigin * 2 + 10
      )
    }, 
    flows_from() : {flow: Flow, aim: Aim}[] {
      return this.aim.flows_from.map((fromAim: Aim) => ({
        flow: this.aimNetwork.$state.flows[fromAim.id][this.aim.id],
        aim: fromAim
      }))
    }, 
    flows_into() : {flow: Flow, aim: Aim}[] {
      return this.aim.flows_into.map((intoAim: Aim) => ({
        flow: this.aimNetwork.$state.flows[this.aim.id][intoAim.id],
        aim: intoAim
      }))
    }, 
  }, 
  methods: {
    keypress(e: KeyboardEvent) {
      if(e.key == 'Enter' && this.dirty) {
        this.commit()
      } 
    }, 
    updateSharesSliderOrigin(){
      this.sharesSliderOrigin = this.aim.shares
    }, 
    updateShares(v: number) {
      if(this.aim.origin.shares === undefined && this.aim.shares !== v) {
        this.aim.origin.shares = this.aim.shares
      } 
      this.aim.shares = v
    }, 
    updateState(v: string) {
      if(this.aim.origin.state  === undefined && this.aim.state !== v) {
        this.aim.origin.state = this.aim.state
      } 
      this.aim.state = v
    }, 
    updateTitle(e: Event) {
      let v = (<HTMLInputElement>e.target).value
      if(this.aim.origin.title === undefined && this.aim.title !== v) {
        this.aim.origin.title = this.aim.title 
      } 
      this.aim.title = v
    }, 
    effortChange(e: Event) {
      this.effortString = (<HTMLInputElement>e.target).value
    }, 
    parseAndUpdateEffort() {
      if(this.effortString !== undefined) {
        let v = Effort.fromString(this.effortString)
        if(this.aim.origin.effort !== undefined && !this.aim.effort.eq(v)) {
          this.aim.origin.effort = this.aim.effort
        } 
        this.aim.effort = v
        this.effortString = undefined
      }
    }, 
    reset() {
      this.aim.origin = new AimOrigin()
    }, 
    commit() {
      this.aimNetwork.commitChanges(this.aim) 
    }, 
    flowClick(flow: Flow) {
      this.aimNetwork.selectFlow(flow)
    }, 
    focusTitle() {
      let titleInput = (this.$refs.title as HTMLInputElement)
      titleInput?.focus()
    }, 
    remove() {
      if(!this.confirmRemove) {
        this.confirmRemove = true
      } else {
        this.aimNetwork.removeAim(this.aim)
      }
    }
  }, 
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.aim-details{
  text-align: center; 
  .button {
    &.confirm {
      background-color: @danger; 
    }
  }
}

</style>

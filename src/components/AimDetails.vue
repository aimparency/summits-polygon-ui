<template>
  <div class="aim-details"> 
    <h3>aim details</h3>
    <input 
      ref='title'
      class='standard title' 
      :value="title" 
      placeholder="<aim title>"
      @input="updateTitle"/>
    <input 
      class='standard effort' 
      :value="effortString ?? effort" 
      @blur='parseAndUpdateEffort'
      onfocus="this.select()" 
      @input="effortChange"/>
    <MultiSwitch
      class='state'
      label="state"
      :value="state"
      :options="stateOptions" 
      @change='updateState'
      />
    <Slider 
      name='shares'
      :left='sharesSliderMin.toFixed(2)'
      :right='sharesSliderMax.toFixed(2)'
      :from='sharesSliderMin'
      :to='sharesSliderMax'
      :value='shares'
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
import { Aim, AimChanges, Flow, useAimNetwork } from "../stores/aim-network"
import Effort from "../types/effort"

import AimLi from "./AimLi.vue"
import MultiSwitch from './MultiSwitch.vue'
import Slider from './Slider.vue'

export default defineComponent({
  name: "AimDetails",
  components: {
    AimLi,
    MultiSwitch,
    Slider, 
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
        Object.keys(this.aim.changes).length > 0 
      ) 
    }, 
    effort() : string {
      if(this.aim.changes.effort) {
        return this.aim.changes.effort.humanize()
      } else {
        return this.aim.effort.humanize()
      }
    }, 
    title() : string {
      return this.aim.changes.title ?? this.aim.title
    }, 
    state() : string {
      return this.aim.changes.state ?? this.aim.state
    }, 
    sharesSliderMin(): number {
      return Math.max(0, this.sharesSliderOrigin / 2 - 10)
    }, 
    sharesSliderMax(): number {
      return this.sharesSliderOrigin * 2 + 10
    }, 
    shares() : number {
      return this.aim.changes.shares ?? this.aim.shares
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
      this.sharesSliderOrigin = this.shares
    }, 
    updateShares(v: number) {
      if(this.aim.shares === v) {
        delete this.aim.changes.shares
      } else {
        this.aim.changes.shares = v
      }
    }, 
    updateState(v: string) {
      if(this.aim.state === v) {
        delete this.aim.changes.state
      } else {
        this.aim.changes.state = v
      }
    }, 
    updateTitle(e: Event) {
      let v = (<HTMLInputElement>e.target).value
      if(this.aim.title === v) {
        delete this.aim.changes.title 
      } else {
        this.aim.changes.title = v
      }
    }, 
    effortChange(e: Event) {
      this.effortString = (<HTMLInputElement>e.target).value
    }, 
    parseAndUpdateEffort() {
      if(this.effortString !== undefined) {
        let newEffort = Effort.fromString(this.effortString)

        if(this.aim.effort.eq(newEffort)) {
          delete this.aim.changes.effort
        } else {
          this.aim.changes.effort = newEffort
        }

        this.effortString = undefined
      }
    }, 
    reset() {
      this.aim.changes = new AimChanges()
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

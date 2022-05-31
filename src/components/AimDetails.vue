<template>
  <div 
    class="aim-details"> 
    <h2 class="sidebar-heading">aim details</h2>
    <textarea
      ref='title'
      class='standard title' 
      placeholder="aim title"
      :value="aim.title"
      @input="updateTitle"></textarea>
    <input 
      class='standard effort' 
      :value="effortString ?? aim.effort.humanize()" 
      @blur='parseAndUpdateEffort'
      @keypress.enter='parseAndUpdateEffort'
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
    <h3> incoming flows </h3>
    <div 
      class="flow" 
      v-for="(flow, aimId) in aim.flowsFrom" 
      @click="flowClick(flow)" 
      :key="aimId">
      {{ flow.from.title || "<unnamed>"}} <br/>
      share: {{ flow.share }}
    </div>
    <h3> outgoing flows </h3>
    <div 
      class="flow" 
      v-for="(flow, aimId) in aim.flowsInto" 
      @click="flowClick(flow)" 
      :key="aimId">
      {{ flow.into.title || "<unnamed>"}} <br/>
      share: {{ flow.share }}
    </div>
    <BackButton @click="aimNetwork.deselect"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"

import { useUi } from "../stores/ui"
import { Aim, Flow, useAimNetwork } from "../stores/aim-network"
import Effort from "../types/effort"

import AimLi from "./AimLi.vue"
import MultiSwitch from './MultiSwitch.vue'
import IntSlider from './IntSlider.vue'
import BackButton from './SideBar/BackButton.vue'

export default defineComponent({
  name: "AimDetails",
  components: {
    AimLi,
    MultiSwitch,
    IntSlider, 
    BackButton,
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
        Object.values(this.aim.origin).filter((v: any) => v !== undefined).length > 0 
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
      if(v === this.aim.origin.shares) { 
        this.aim.origin.shares = undefined
      } else if(this.aim.origin.shares === undefined) {
        this.aim.origin.shares = this.aim.shares
      }
      this.aim.shares = v
    }, 
    updateState(v: string) {
      if(v === this.aim.origin.state) { 
        this.aim.origin.state = undefined
      } else if(this.aim.origin.state === undefined) {
        this.aim.origin.state = this.aim.state
      }
      this.aim.state = v
    }, 
    updateTitle(e: Event) {
      const v = (<HTMLTextAreaElement>e.target).value
      if(v === this.aim.origin.title) { 
        this.aim.origin.title = undefined
      } else if(this.aim.origin.title === undefined) {
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
        if(v.eq(this.aim.origin.effort)) { 
          this.aim.origin.effort = undefined
        } else if(this.aim.origin.effort === undefined) {
          this.aim.origin.effort = this.aim.effort
        }
        this.aim.effort = v
        this.effortString = undefined
      }
    }, 
    reset() {
      this.aimNetwork.resetChanges(this.aim)
      this.updateSharesSliderOrigin()
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
  textarea {
    height: 10em; 
  }
}

</style>

<template>
  <div 
    class="aim-details"> 
    <h2 class="sidebar-heading">aim details</h2>

    
    <p class="permissions">
      permisions: 
      <span v-for="permission, key in permissions">{{ permission }}</span>
      <span v-if="permissions.length == 0">
        none
      </span>
    </p>

    <textarea
      ref='title'
      rows="4"
      class='title' 
      placeholder="aim title"
      :value="aim.title"
      @input="updateTitle"></textarea>
    <textarea
      ref='description'
      rows="9"
      class='description' 
      placeholder="aim description"
      :value="aim.description"
      @input="updateDescription"></textarea>
    <input 
      class='effort' 
      :value="aim.effort" 
      placeholder="effort"
      @input="updateEffort"/>
    <MultiSwitch
      class='state'
      label="state"
      :value="aim.state"
      :options="stateOptions" 
      @change='updateState'
      />

    <div v-if="aim.address">
      token: <span class="tokenInfo"><input size="13" placeholder="token name" :value="aim.tokenName"/></span>
      <span class="tokenInfo"><input size="5" placeholder="symbol" :value="aim.tokenSymbol"/></span>
      <p class="supply">current supply: <b>{{aim.totalSupply}}</b></p>
    </div>
    <p v-else> initial investment: </p>
    <BigIntSlider 
      name='balance'
      :left='tokensSliderMin.toString()'
      :right='tokensSliderMax.toString()'
      :from='tokensSliderMin'
      :to='tokensSliderMax'
      :value='aim.tokens'
      unit="tokens"
      @drag-end='updateTokensSliderOrigin'
      @update='updateTokens'/>
    <div v-if="aim.pendingTransactions"> 
      <div class="spinner"></div>
    </div>
    <div v-else>
      <span v-if='dirty && aim.title'>
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
    <Slider
      name='loop weight'
      left='0'
      right='100'
      :factor="100/0xffff"
      :decimalPlaces='2'
      :from='0'
      :to='0xffff'
      :value='aim.loopWeight'
      @update='updateLoopWeight'/>
    <div 
      class="flow button" 
      v-for="(flow, aimId) in aim.flowsFrom" 
      @click="flowClick(flow)" 
      :key="aimId">
      {{ (100 * flow.share).toFixed(0) }}% : 
      {{ flow.from.title || "[unnamed]"}} 
    </div>
    <h3> outgoing flows </h3>
    <div 
      class="flow button" 
      v-for="(flow, aimId) in aim.flowsInto" 
      @click="flowClick(flow)" 
      :key="aimId">
      {{ (100 * flow.share).toFixed(0) }}%: 
      {{ flow.into.title || "[unnamed]"}} 
    </div>
    <div class="scrollspace"/>
    <BackButton @click="aimNetwork.deselect"/>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"

import { useUi } from "../stores/ui"
import { Aim, Flow, useAimNetwork } from "../stores/aim-network"

import AimLi from "./AimLi.vue"
import MultiSwitch from './MultiSwitch.vue'
import BigIntSlider from './BigIntSlider.vue'
import Slider from './Slider.vue'
import BackButton from './SideBar/BackButton.vue'

export default defineComponent({
  name: "AimDetails",
  components: {
    AimLi,
    MultiSwitch,
    BigIntSlider, 
    Slider, 
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
      tokenSliderOrigin: 0n,
      stateOptions: [
        {
          value: "untouched", 
          color: "#288"
        }, 
        {
          value: "brewing", 
          color: "#892", 
        }, 
        {
          value: "wip", 
          color: "#a74", 
        }, 
        { 
          value: "maintainance", 
          color: "#56b", 
        }
      ]
    }
  }, 
  mounted() {
    this.updateTokensSliderOrigin()
  },
  computed: {
    permissions() : string[] {
      if(this.aim.permissions == Aim.Permissions.ALL) {
        return ['ALL']
      } else {
        let permissions: string[] = []
        for(let name in Aim.Permissions) {
          let bits = Aim.Permissions[name]
          if((this.aim.permissions & bits) == bits) {
            permissions.push(name) 
          }
        }
        return permissions
      }
    }, 
    dirty() : boolean {
      return ( 
        Object.values(this.aim.origin).filter((v: any) => v !== undefined).length > 0 
      ) 
    }, 
    tokensSliderMin(): bigint {
      let min = this.tokenSliderOrigin / 2n - 1000000n
      if(min < 0n) {
        min = 0n
      }
      return min
    }, 
    tokensSliderMax(): bigint {
      return this.tokenSliderOrigin * 2n + 1000000n
    }, 
  }, 
  methods: {
    keypress(e: KeyboardEvent) {
      if(e.key == 'Enter' && this.dirty) {
        this.commit()
      } 
    }, 
    updateTokensSliderOrigin(){
      this.tokenSliderOrigin = this.aim.tokens
    }, 
    updateTokens(v: number) {
      if(v === this.aim.origin.tokens) { 
        this.aim.origin.tokens = undefined
      } else if(this.aim.origin.tokens === undefined) {
        this.aim.origin.tokens = this.aim.tokens
      }
      this.aim.setTokens(v) 
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
    updateDescription(e: Event) {
      const v = (<HTMLTextAreaElement>e.target).value
      if(v === this.aim.origin.description) { 
        this.aim.origin.description = undefined
      } else if(this.aim.origin.description === undefined) {
        this.aim.origin.description = this.aim.description
      }
      this.aim.description = v
    }, 
    effortChange(e: Event) {
      this.effortString = (<HTMLInputElement>e.target).value
    }, 
    updateEffort(e: Event) {
      const v = Number((<HTMLTextAreaElement>e.target).value)
      if(v === this.aim.origin.effort) { 
        this.aim.origin.effort = undefined
      } else if(this.aim.origin.effort === undefined) {
        this.aim.origin.effort = this.aim.effort
      }
      this.aim.effort = v
    }, 
    reset() {
      this.aimNetwork.resetAimChanges(this.aim)
      this.updateTokensSliderOrigin()
    }, 
    commit() {
      if(this.dirty) {
        if(this.aim.address) {
          this.aimNetwork.commitAimChanges(this.aim)
        } else {
          this.aimNetwork.publishAimOnChain(this.aim) 
        }
      }
    }, 
    flowClick(flow: Flow) {
      this.aimNetwork.selectFlow(flow)
    }, 
    remove() {
      if(!this.confirmRemove) {
        this.confirmRemove = true
      } else {
        this.aimNetwork.removeAim(this.aim)
      }
    },
    updateLoopWeight(v: number) {
      this.aim.setLoopWeight(v)
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
  .tokenInfo {
    margin: 0.5rem;
    input {
      display: inline-block; 
      width: auto; 
    }
  }
  .flow {
    text-align: left; 
    display: block; 
  }
  textarea {
    resize: vertical; 
  }
  h3 {
    margin: 1rem auto; 
    padding-top: 2rem; 
  }
  p.supply {
    margin:0.5rem; 
  }
  p.permissions {
    margin: 1rem; 
    span {
      padding: 0.3rem;
      border-radius: 0.3rem; 
      background-color: #fff4; 
    }
  }
}

</style>

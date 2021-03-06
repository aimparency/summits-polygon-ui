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
      :value='aim.effort == 0 ? "" : aim.effort'
      placeholder="effort"
      @input="updateEffort"/>
    <MultiSwitch
      class='status'
      label="status"
      :value="aim.status"
      :options="statusOptions" 
      @change='updateState'
      />
        
    <div class="fieldButtons">
      <div
        v-if="dirty" 
        class='button' tabindex="0"  
        @click="reset">reset</div>
      <div 
        v-if="dirty && public"
        class='button'
        tabindex="0"
        @click="commitChanges">commit changes</div>
      <div
        tabindex="0"  
        class='button' 
        :class='{confirm: confirmRemove}'
        @blur='confirmRemove = false'
        @click="remove">{{ confirmRemove ? "confirm removal" : "remove" }}</div>
      <div
        v-if="public"
        tabindex="0"
        class='button'
        :class="{share: !justCopiedToClipboard, copied: justCopiedToClipboard}"
        @click="share">{{justCopiedToClipboard ? "copied to clipboard!" : ""}}</div>
    </div>

    <div >
      <span v-if="aim.address == undefined">
        <input class="tokenInfo" size="13" placeholder="token name" 
          :value="aim.tokenName"
          @input="changeTokenName"/>
        <input class="tokenInfo" size="5" placeholder="symbol" 
          :value="aim.tokenSymbol"
          @input="changeTokenSymbol"/>
        <p> initial investment: </p>
      </span>
      <div v-else>
        <h3> investment </h3>
        <p v-if="aim.address" class="supply">current supply: <b class="nowrap">{{aim.tokenSupply}} {{ aim.tokenSymbol }}</b></p>
      </div>
    </div>
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
    <div v-else-if="aim.address == undefined">
      <div 
        v-if='aim.title != "" && aim.tokenName != "" && aim.tokenSymbol != ""'
        class='button' 
        tabindex="0" 
        @click="createAimOnChain">create aim on chain</div>
      <p v-else> 
        <span class="error">
          title and token name and symbol are required for creating an aim on chain.
        </span>
      </p>
    </div>
    <div v-else-if='trade !== undefined'>
      <div class='button' tabindex="0" @click="resetTokens"> 
        reset
      </div>
      <div
        class='button' tabindex="0" @click="doTrade"> 
        {{ trade.verb }} {{ trade.amount }} {{ aim.tokenSymbol }} for <br/> {{ trade.price }} a{{ nativeCurrency.symbol }}
      </div>
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

import { Aim, Flow, useAimNetwork } from "../stores/aim-network"

import AimLi from "./AimLi.vue"
import MultiSwitch from './MultiSwitch.vue'
import BigIntSlider from './BigIntSlider.vue'
import Slider from './Slider.vue'
import BackButton from './SideBar/BackButton.vue'

import config from '../config'

interface Trade {
  verb: string, 
  amount: bigint, 
  price: bigint
}

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
    return { 
      aimNetwork, 
      confirmRemove: false, 
      tokenSliderOrigin: 0n,
      statusOptions: [
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
      ],
      nativeCurrency: config.networks[config.network].nativeCurrency, 
      justCopiedToClipboard: false,
    }
  }, 
  mounted() {
    this.updateTokensSliderOrigin()
  },
  watch: {
    aim: {
      handler(_new, _old) {
        this.updateTokensSliderOrigin()
      },
      deep: false
    }
  },
  computed: {
    public() {
      return this.aim.address !== undefined
    },
    trade() : undefined | Trade {
      const aim = this.aim
      if( aim.tokens !== aim.tokensOnChain) {
        let amount = aim.tokens - aim.tokensOnChain
        let volPricePre = aim.tokenSupply * aim.tokenSupply
        let newSupply = aim.tokenSupply + amount
        let volPricePost = newSupply * newSupply
        let price = volPricePost - volPricePre
        if( amount > 0n ) {
          return {
            verb: 'buy', 
            amount,
            price
          }
        } else {
          return {
            verb: 'sell', 
            amount: -amount, 
            price: -price
          }
        }
      }
    }, 
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
    share() {
      let url = `${window.location.origin}/?loadAim=${this.aim.address}`
      navigator.clipboard.writeText(url).then(() => {
        this.justCopiedToClipboard = true
        setTimeout(() => {
          this.justCopiedToClipboard = false
        }, 3000)
      })
    },
    updateTokensSliderOrigin(){
      this.tokenSliderOrigin = this.aim.tokens
    }, 
    updateTokens(v: bigint) {
      this.aim.updateTokens(v) 
    }, 
    updateState(v: string) {
      this.aim.updateState(v) 
    }, 
    updateTitle(e: Event) {
      const v = (<HTMLTextAreaElement>e.target).value
      this.aim.updateTitle(v) 
    }, 
    updateDescription(e: Event) {
      const v = (<HTMLTextAreaElement>e.target).value
      this.aim.updateDescription(v)
    }, 
    updateEffort(e: Event) {
      let inputEl = (<HTMLTextAreaElement>e.target)
      const v = Number(inputEl.value)
      if(!isNaN(v)) {
        this.aim.updateEffort(v) 
      } else {
        inputEl.value = this.aim.effort.toString()
      }
    }, 
    reset() {
      this.aimNetwork.resetAimChanges(this.aim)
      this.updateTokensSliderOrigin()
    }, 
    resetTokens() {
      this.aim.setTokens(this.aim.tokensOnChain)
      this.updateTokensSliderOrigin()
    }, 
    createAimOnChain() {
      this.aimNetwork.createAimOnChain(this.aim) 
    }, 
    commitChanges() {
      if(this.dirty) {
        this.aimNetwork.commitAimChanges(this.aim) 
      }
    }, 
    doTrade() {
      // allow price slip
      if(this.trade !== undefined) {
        if(this.trade.verb == "buy") {
          this.aimNetwork.buyTokens(this.aim, this.trade.amount, this.trade.price) 
        } else {
          this.aimNetwork.sellTokens(this.aim, this.trade.amount, this.trade.price) 
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
    }, 
    changeTokenName(e: Event) {
      const v = (<HTMLInputElement>e.target).value
      this.aim.tokenName = v
    }, 
    changeTokenSymbol(e: Event) {
      const v = (<HTMLInputElement>e.target).value
      this.aim.tokenSymbol = v
    }
  }, 
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.aim-details{
  text-align: center; 
  .fieldButtons {
    margin: 1rem; 
    .share {
      background-image: url(/share.svg);
      background-size: 50%;
      background-repeat: no-repeat;
      background-position: center;
      height: 2.5rem; 
      width: 2.5rem;
      padding: 0; 
    }
    .copied{
      background-image: none;
      background-color: shade(@c3, 10%);
      height: auto;
      width: auto;
    }
  }
  .button {
    &.confirm {
      background-color: @danger; 
    }
  }
  .tokenInfo {
    margin: 0.5rem;
    display: inline-block; 
    width: auto; 
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
  p.permissions {
    span {
      padding: 0.3rem;
      border-radius: 0.3rem; 
      background-color: #fff4; 
    }
  }
}

</style>

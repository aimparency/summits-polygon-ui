<template>
  <div 
    @click="click"
    class="connection-status">
    <h3>eth-connection</h3>
    <p> network: {{ web3Connection.network }} </p>
    <p> address: {{ address }} </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useWeb3Connection } from "../stores/web3-connection";

export default defineComponent({
  name: "ConnectionStatus",
  props: {
    msg: String,
  },
  computed: {
    address() {
      let full = this.web3Connection.address
      return full.slice(0,4) + "..." + full.slice(-4) 
    }
  }, 
  setup() {
    const web3Connection = useWeb3Connection()
    return {
      web3Connection
    }
  },
  methods: {
    click() {
      //TBD do sth maybe
    }
  }
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.connection-status {
  * {
    margin: 0.1rem;
    pointer-events: none; 
  }
  position: fixed; 
  right: 2rem; 
  top: 2rem; 
  text-align: right; 
  background-color: @bg1;
  opacity: 0.5; 
  padding: 1rem; 
  border-radius: 1rem; 
  &:hover {
    opacity: 1; 
    box-shadow: 0 0 2rem #0008; 
  }
  cursor: pointer; 
}
</style>

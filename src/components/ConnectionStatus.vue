<template>
  <div class="connection-status">
    <h1>connection-status</h1>
    <p> network: {{ web3Connection.network }} </p>
    <p> address: {{ web3Connection.address }} </p>
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
  setup() {
    const web3Connection = useWeb3Connection()
    return {
      web3Connection
    }
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
</style>

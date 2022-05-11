<template>
  <ConnectionStatus/>
  <AimMap/>
  <SideBar/>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { ethers } from "ethers";
import Web3Modal from "web3modal";

import ConnectionStatus from "./components/ConnectionStatus.vue";
import AimMap from "./components/AimMap.vue";
import SideBar from "./components/SideBar.vue";

import { useWeb3Connection } from "./stores/web3-connection";

export default defineComponent({
  name: "App",
  components: {
    ConnectionStatus, 
    AimMap,
    SideBar,
  },
  setup() {
    const web3Connection = useWeb3Connection()
    return {
      web3Connection
    }
  }, 
  mounted() {
    this.web3Connection.connect();
  },
  methods: {
  },
});
</script>

<style lang="less"></style>

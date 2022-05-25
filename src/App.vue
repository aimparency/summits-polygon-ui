<template>
  <ConnectionStatus/>
  <AimMap/>
  <SideBar/>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { useAimNetwork } from "./stores/aim-network"
import { useWeb3Connection } from "./stores/web3-connection";

import ConnectionStatus from "./components/ConnectionStatus.vue";
import AimMap from "./components/AimMap.vue";
import SideBar from "./components/SideBar.vue";

export default defineComponent({
  name: "App",
  components: {
    ConnectionStatus, 
    AimMap,
    SideBar,
  },
  setup() {
    useWeb3Connection().connect(() => {
      useAimNetwork().loadHomeNode()
    }) 
  }, 
  methods: {
  },
});
</script>

<style lang="less"></style>

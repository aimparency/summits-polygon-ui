<template>
  <Map/>
  <SideBar/>
  <ConnectionStatus/>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { useAimNetwork } from "./stores/aim-network"
import { useWeb3Connection } from "./stores/web3-connection";
import { useUi } from "./stores/ui";

import ConnectionStatus from "./components/ConnectionStatus.vue";
import Map from "./components/Map.vue";
import SideBar from "./components/SideBar.vue";

export default defineComponent({
  name: "App",
  components: {
    ConnectionStatus, 
    Map,
    SideBar,
  },
  setup() {
    useWeb3Connection().connect(() => {
      useAimNetwork().loadHome()
    }) 
    let ui = useUi()
    const onResize = () => {
      ui.setScreenSize(
        window.innerWidth, 
        window.innerHeight
      )
    }
    window.addEventListener('resize', onResize)
    onResize()
  }, 
  data() {
    return {}
  },
  methods: {
  },
});
</script>
<style lang="less">
/* {
  outline: 1px solid #4f35; 
} /**/

* {
  color: white; 
  font-family: sans-serif; 
}

input, textarea {
  font-size: 1rem; 
  width: calc(100% - 2rem); 
  margin: 0.5rem; 
  padding: 0.5rem; 
  border: none; 
  border-radius: @secondaryradius; 
  &:focus {
    outline: 0.2rem solid #fff8; 
  }
}

input, textarea {
  background-color: #0004; 
}

.sidebar-heading {
  text-align: center; 
  line-height: 2rem; 
  padding: 0.5rem 1rem; 
  margin: 0; 
  margin-bottom: 0.5rem; 
  background-color: @mid2; 
}

</style>

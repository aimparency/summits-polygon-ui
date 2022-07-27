<template>
  <Map/>
  <ConnectionStatus/>
  <SideBar/>
  <Hint/>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import { useAimNetwork } from "./stores/aim-network"
import { useWeb3Connection } from "./stores/web3-connection";
import { useUi } from "./stores/ui";

import ConnectionStatus from "./components/ConnectionStatus.vue";
import Map from "./components/Map.vue";
import SideBar from "./components/SideBar.vue";
import Hint from "./components/Hint.vue";

export default defineComponent({
  name: "App",
  components: {
    ConnectionStatus, 
    Map,
    SideBar,
    Hint
  },
  setup() {
    useWeb3Connection().connect(() => {
        useAimNetwork().loadInitial()
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
  padding: 0.5rem; 
  border: none; 
  border-radius: @secondaryradius; 
  box-sizing: border-box; 
  &:focus {
    outline: 0.2rem solid #fff8; 
  }
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

div.scrollspace {
  height: 5rem;
}

::-webkit-scrollbar {
    width: 0.5em;
    z-index: 1; 
}

::-webkit-scrollbar-thumb {
    background: #fff4;
    border-radius: 0.25rem;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.75);
}

div.spinner{
  @border: 0.5rem solid @c1; 
  display: inline-block; 
  border: 0.5rem solid #8880; 
  border-radius: 50%;
  width: 2.5em;
  height: 2.5em;
  margin: 0.425rem 0.2rem; 
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
} 

p {
  margin: 1rem; 
}

h3 {
  margin: 1rem auto; 
  padding-top: 2rem; 
}

.nowrap {
  white-space: nowrap; 
}
</style>

<template>
  <span v-if="justCopiedToClipboard" class="short-address copied">
    copied!
  </span>
  <span v-else class="short-address" @click="toggle">
    {{ expanded ? address : shortAddress }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['update', 'drag-end'],
  props: {
    address: String,
  },
  data() {
    return {
      expanded: false,
      justCopiedToClipboard: false
    }
  },
  computed: {
    shortAddress() {
      return this.address.substring(0, 6) + '...' + this.address.slice(-4)
    },
  },
  mounted () {
  },
  methods: {
    toggle() {
      console.log("toggle") 
      if(this.expanded) {
        navigator.clipboard.writeText(this.address).then(() => {
          this.justCopiedToClipboard = true
          setTimeout(() => {
            this.justCopiedToClipboard = false
          }, 1700)
        })
      }
      this.expanded = !this.expanded
    },
  }
})
</script>

<style lang="less">
.short-address {
  cursor: pointer;
  white-space: nowrap;
  background-color: fade(@c1, 50%);
  padding: 0.25rem; 
  border-radius: 0.3rem;
  user-select: none; 
}
.copied {
  background-color: fade(@c3, 50%);
}
</style>

<template>
  <div class="multi-switch">
    <span v-if="label" class="label"> {{ label }}: </span>
    <div 
      v-for="option, i in options"
      :key="i"
      :style="{backgroundColor: option.color}"
      class="option"
      :class="{ selected: option.value == value}"
      @click="select(i)">
      {{ option.value }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface Option {
 value: string, 
 color: string
}

export default defineComponent({
  emits: ['change'],
  props: {
    label: {
      type: String, 
    }, 
    options: {
      type: Array as PropType<Option[]>,
      required: true  
    }, 
    value: {
      type: String, 
      required: true
    }
  },
  methods: {
    select(i: number) {
      this.$emit('change', this.options[i].value) 
    },
  }
})
</script>

<style lang="less">
@dotsize: 3em;

.multi-switch {
  margin: 0.5rem; 
  .option {
    margin: 0.25rem;
    display: inline-block; 
    opacity: 0.9; 
    cursor: pointer;        
    padding: 0.5rem; 
    border-radius: 0.2rem; 
    box-shadow: 0 0 0.5rem #0008; 
    &.selected {
      opacity: 1; 
      outline: 0.2rem solid #fff6; 
    }
  }
}
</style>

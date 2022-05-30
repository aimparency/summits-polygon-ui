<template>
  <div class="slider">
    <div class="value">
      {{name}}:
      <input :value="value" @change="setValue" tabindex="0"/> 
      {{unit}}
    </div>
    <div class="left">{{left}}</div>
    <div class="right">{{right}}</div>
    <div class="bar" ref="bar">
      <div class="dot"
        :style="{left: `${(value - from) / (to - from) * 100}%`}"
        :class="{dragging}"
        @mousedown.prevent="startDrag"
        @touchstart.prevent="startDrag">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['update', 'drag-end'],
  props: {
    name: String,
    from: {
      type: Number,
      required: true
    },
    to: {
      type: Number,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    left: {
      type: String,
      default: 'low'
    },
    right: {
      type: String,
      default: 'high'
    },
    unit: {
      type: String,
      default: ''
    }
  },
  setup() {
    return {
      dragging: false,
      dragOffset: 0,
      x0: 0,
      width: 1
    }
  },
  mounted () {
    document.addEventListener('mouseup', this.endMouse)
    document.addEventListener('mouseleave', this.endMouse)
    document.addEventListener('mousemove', this.drag)

    document.addEventListener('touchend', this.endTouch)
    document.addEventListener('touchcancel', this.endTouch)
    document.addEventListener('touchmove', this.drag)
  },
  methods: {
    startDrag (e: MouseEvent | TouchEvent) {
      const bound = (this.$refs.bar as HTMLDivElement).getBoundingClientRect()
      this.x0 = bound.left
      this.width = bound.right - bound.left
      this.dragOffset = 0
      const v = this.getV(e)
      this.dragging = true
      this.dragOffset = (this.value - v) / (this.to - this.from)
    },
    endMouse (e: MouseEvent | TouchEvent) {
      this.drag(e)
      this.endDrag()
    },
    endTouch () {
      this.endDrag()
    },
    endDrag () {
      if (this.dragging) {
        this.dragging = false
        this.$emit('drag-end')
      }
    },
    drag (e: MouseEvent | TouchEvent) {
      if (this.dragging) {
        const v = this.getV(e)
        this.$emit('update', v)
      }
    },
    setValue(e: Event) {
      let v = parseInt((<HTMLInputElement>e.target).value)
      this.$emit('update', v)
      this.$emit('drag-end')
    },
    getV (e: MouseEvent | TouchEvent) {
      let x = 0
      if (e instanceof MouseEvent) {
        x = e.x
      } else if (e instanceof TouchEvent) {
        x = e.touches[0].pageX
      }
      let r = (x - this.x0) / this.width
      r += this.dragOffset
      r = Math.min(1, Math.max(0, r))
      return this.from + (this.to - this.from) * r
    },
    beforeUnmount () {
      document.removeEventListener('mouseup', this.endDrag)
      document.removeEventListener('mouseleave', this.endDrag)
      document.removeEventListener('mousemove', this.drag)

      document.removeEventListener('touchend', this.endDrag)
      document.removeEventListener('touchcancel', this.endDrag)
      document.removeEventListener('touchmove', this.drag)
    }
  }
})
</script>

<style lang="less">
@dotsize: 3rem;

.slider {
  position: relative; 
  background-color: #0004;
  border-radius: @secondaryradius;
  height: 6.5rem; 
  margin: 1rem; 
  .value{
    width: 100%; 
    position: absolute; 
    top: 0.7rem; 
    text-align: center; 
    input {
      display: inline-block;
      width: 4rem; 
    }
  }
  .bar {
    position: absolute;
    top: 4rem; 
    width: calc(100% - @dotsize - 1rem);
    height: 0.35rem;
    background: shade(@c2, 40%);
    border-radius: 0.2rem;
    left: calc(0.5rem + @dotsize * 0.5);
    .dot {
      left: 0; 
      transition: left 0.15s ease-in-out; 
      &.dragging{
        transition: none; 
      }
      box-shadow: 0 0 0.5rem #0007;
      position: absolute;
      height: @dotsize;
      width: @dotsize;
      top: 50%;
      transform: translate(-50%, -50%);
      border-radius: @dotsize * 0.5;
      background-color: @c2;
      box-sizing: border-box;
      border: 0.4rem solid shade(@c2, 20%);
    }
  }
  .right, .left{
    position: absolute;
    top: 0.7rem;
    color: #999;
  }
  .left {
    left: 0.5rem;
  }
  .right {
    right: 0.5rem;
  }
}
</style>

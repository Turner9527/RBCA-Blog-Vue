<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  size: { type: Number, default: 40 },
})

const src = computed(() => {
  if (!props.avatar) return ''
  if (props.avatar.startsWith('http')) return props.avatar
  return '/dev-api' + props.avatar
})

const initial = computed(() => {
  const n = (props.name || '?').trim()
  return n ? n.charAt(0).toUpperCase() : '?'
})
</script>

<template>
  <img v-if="src" :src="src" class="avatar-img" :style="{ width: size + 'px', height: size + 'px' }" />
  <div v-else class="avatar-letter" :style="{ width: size + 'px', height: size + 'px', lineHeight: size + 'px', fontSize: size * 0.45 + 'px' }">
    {{ initial }}
  </div>
</template>

<style scoped>
.avatar-img,
.avatar-letter {
  border-radius: 50%;
  display: inline-block;
  object-fit: cover;
  flex-shrink: 0;
}
.avatar-letter {
  background: #409eff;
  color: #fff;
  text-align: center;
  font-weight: bold;
  user-select: none;
}
</style>

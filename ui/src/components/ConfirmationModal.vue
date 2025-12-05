<template>
  <div v-if="open" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button class="btn" @click="emit('cancel')">Cancel</button>
        <button class="btn btn-primary" @click="emit('confirm')">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

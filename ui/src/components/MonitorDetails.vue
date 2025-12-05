<template>
  <div class="p-6">
    <div v-if="monitor">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">{{ monitor.name }}</h1>
        <div>
          <button
            v-if="monitor.alarmState"
            class="btn btn-xs btn-warning"
            @click="handleAcknowledge(monitor.uuid)"
          >
            Acknowledge
          </button>
          <router-link :to="{ name: 'Home' }" class="btn btn-ghost btn-xs">Back to Home</router-link>
        </div>
      </div>
      <p>Interval: {{ monitor.intervalSeconds }} seconds</p>
      <p>Status: {{ monitor.alarmState ? 'Alarm' : 'Ok' }}</p>
      <p>Enabled: {{ monitor.enabled ? 'Yes' : 'No' }}</p>
      <div class="mt-3 text-sm flex items-center gap-2">
        <a
          :href="`${baseUrl}/ack/${monitor.uuid}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-base-content/70 hover:underline break-all"
        >
          {{ baseUrl }}/ack/{{ monitor.uuid }}
        </a>
        <button
          type="button"
          class="btn btn-xs"
          @click="copyAckUrl"
          title="Copy acknowledge URL"
          :aria-label="`Copy ack url ${baseUrl}/ack/${monitor.uuid}`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m2 0a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2zM7 12H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
          </svg>
        </button>
        <span v-if="copiedAck" class="text-xs text-success">Copied!</span>
      </div>

      <h2 class="text-xl font-bold mt-6">History</h2>
      <div class="flex items-center justify-between mt-4">
        <div class="form-control">
          <select class="select select-bordered" v-model="filterStatus">
            <option value="all">All</option>
            <option value="triggered">Triggered</option>
            <option value="reset">Reset</option>
            <option value="suppressed">Suppressed</option>
          </select>
        </div>
        <div class="join">
          <button
            class="btn btn-sm join-item"
            :disabled="historyPage === 1"
            @click="historyPage--"
          >
            «
          </button>
          <button class="btn btn-sm join-item">
            Page {{ historyPage }} of {{ historyPageCount }}
          </button>
          <button
            class="btn btn-sm join-item"
            :disabled="historyPage === historyPageCount"
            @click="historyPage++"
          >
            »
          </button>
        </div>
      </div>
      <div class="overflow-x-auto mt-4">
        <table class="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!paginatedHistory.length">
              <td colspan="2" class="text-center text-base-content/70">
                No history found.
              </td>
            </tr>
                <tr v-for="(item, index) in paginatedHistory" :key="index">
                  <td>{{ new Date(item.timestamp).toLocaleString() }}</td>
                  <td>
                    <span
                      class="btn btn-xs"
                      :class="{
                        'btn-error': item.status === 'triggered',
                        'btn-success': item.status === 'reset',
                        'btn-warning': item.status === 'suppressed',
                      }"
                    >
                      {{ formatStatus(item.status) }}
                    </span>
                  </td>
                </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
  <ConfirmationModal
    :open="confirmationModal.open"
    :title="confirmationModal.title"
    :message="confirmationModal.message"
    @confirm="confirmationModal.onConfirm"
    @cancel="confirmationModal.open = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { acknowledgeMonitor, fetchMonitor } from '../services/api';
import type { Monitor } from '../services/api';
import ConfirmationModal from './ConfirmationModal.vue';

const props = defineProps({
  uuid: {
    type: String,
    required: true,
  },
});

const monitor = ref<Monitor | null>(null);
const filterStatus = ref('all');
const historyPage = ref(1);
const HISTORY_PAGE_SIZE = 10;
const errorMessage = ref('');

const confirmationModal = reactive({
  open: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

const showError = (message: string) => {
  errorMessage.value = message;
  setTimeout(() => {
    if (errorMessage.value === message) {
      errorMessage.value = '';
    }
  }, 5000);
};

const loadMonitor = async () => {
  try {
    monitor.value = await fetchMonitor(props.uuid);
  } catch (error) {
    console.error('Error fetching monitor:', error);
    showError('Unable to load monitor details');
  }
};

const baseUrl = window.location.origin;

const handleAcknowledge = (uuid: string) => {
  confirmationModal.title = 'Acknowledge Alarm';
  confirmationModal.message = 'Are you sure you want to acknowledge this alarm?';
  confirmationModal.onConfirm = async () => {
    try {
      await acknowledgeMonitor(uuid);
      await loadMonitor();
    } catch (error) {
      console.error(error);
      showError('Unable to acknowledge monitor');
    } finally {
      confirmationModal.open = false;
    }
  };
  confirmationModal.open = true;
};

const filteredHistory = computed(() => {
  if (!monitor.value) return [];
  if (filterStatus.value === 'all') {
    return monitor.value.history;
  }
  return monitor.value.history.filter((item) => item.status === filterStatus.value);
});

const sortedHistory = computed(() => {
  return [...filteredHistory.value].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
});

const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * HISTORY_PAGE_SIZE;
  return sortedHistory.value.slice(start, start + HISTORY_PAGE_SIZE);
});

const historyPageCount = computed(() =>
  Math.max(1, Math.ceil(sortedHistory.value.length / HISTORY_PAGE_SIZE))
);

onMounted(async () => {
  await loadMonitor();
});

const formatStatus = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const copiedAck = ref(false);

const copyAckUrl = async () => {
  const text = `${baseUrl}/ack/${monitor.value?.uuid ?? props.uuid}`;
  try {
    if (navigator && 'clipboard' in navigator) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copiedAck.value = true;
    setTimeout(() => (copiedAck.value = false), 2000);
  } catch (err) {
    console.error('Copy failed', err);
    showError('Unable to copy URL');
  }
};
</script>

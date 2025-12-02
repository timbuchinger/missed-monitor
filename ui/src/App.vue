<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-6xl mx-auto space-y-10">
      <header class="space-y-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.3em] text-primary text-center sm:text-left">
              Missed Monitor
            </p>
            <h1 class="text-4xl font-black text-center sm:text-left">Operations Dashboard</h1>
          </div>
          <label class="form-control w-full max-w-xs self-center sm:self-start">
            <div class="label">
              <span class="label-text font-semibold">Theme</span>
            </div>
            <select
              class="select select-bordered"
              v-model="selectedTheme"
              data-test="theme-select"
            >
              <option v-for="theme in themeOptions" :key="theme.value" :value="theme.value">
                {{ theme.label }}
              </option>
            </select>
          </label>
        </div>
        <p class="text-base text-base-content/70 text-center sm:text-left">
          Track heartbeat monitors and delivery notifications for your services.
        </p>
      </header>

      <div v-if="errorMessage" class="alert alert-error shadow-lg">
        <span>{{ errorMessage }}</span>
        <button class="btn btn-ghost btn-sm" @click="errorMessage = ''">Close</button>
      </div>

      <section class="card bg-base-100 shadow-xl">
        <div class="card-body gap-6">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="card-title">Groups</h2>
              <p class="text-sm text-base-content/70">
                Organize monitors into logical teams and see how busy each group is.
              </p>
            </div>
            <button class="btn btn-accent" data-test="add-group" @click="openGroupModal('create')">
              Add Group
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th class="w-32 text-center">Monitors</th>
                  <th class="w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="groupLoading">
                  <td colspan="3">
                    <div class="flex justify-center py-6">
                      <span class="loading loading-spinner loading-md"></span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="!groupsWithCounts.length" class="text-center text-base-content/70">
                  <td colspan="3">No groups yet. Create one to start organizing monitors.</td>
                </tr>
                <tr
                  v-for="group in groupsWithCounts"
                  :key="group.id"
                  data-test="group-row"
                >
                  <td class="font-semibold">{{ group.name }}</td>
                  <td class="text-center">
                    <span class="badge badge-outline">{{ group.monitorCount }}</span>
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="btn btn-ghost btn-xs"
                        aria-label="Edit group"
                        @click="openGroupModal('edit', group)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.862 4.487 19.5 7.125m0 0-9.9 9.9a4.5 4.5 0 0 1-1.591 1.04L6 18l-.065-1.995a4.5 4.5 0 0 1 1.04-1.591l9.9-9.9m3.625 3.625L21 6.75a2.25 2.25 0 0 0-3.182-3.182l-1.238 1.238"
                          />
                        </svg>
                      </button>
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        aria-label="Delete group"
                        @click="handleGroupDelete(group.id, group.monitorCount)"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9.75 9.75 14.25 14.25M14.25 9.75 9.75 14.25M3.75 6H20.25M18 6 17.25 19.5a1.5 1.5 0 0 1-1.5 1.5H8.25a1.5 1.5 0 0 1-1.5-1.5L6 6"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="card bg-base-100 shadow-xl">
        <div class="card-body gap-6">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="card-title">Monitors</h2>
              <p class="text-sm text-base-content/70">
                View heartbeat monitors and their alarm status.
              </p>
            </div>
            <button class="btn btn-primary" data-test="add-monitor" @click="openMonitorModal('create')">
              Add Monitor
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Interval (s)</th>
                  <th>Enabled</th>
                  <th class="w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="monitorLoading">
                  <td colspan="5">
                    <div class="flex justify-center py-6">
                      <span class="loading loading-spinner loading-md"></span>
                    </div>
                  </td>
                </tr>
                <tr
                  v-else-if="!visibleMonitors.length"
                  class="text-center text-base-content/70"
                >
                  <td colspan="5">No monitors yet. Add your first monitor to begin.</td>
                </tr>
                <tr
                  v-for="monitor in visibleMonitors"
                  :key="monitor.uuid"
                  data-test="monitor-row"
                >
                  <td>
                    <div class="font-semibold">{{ monitor.name }}</div>
                    <div class="text-xs text-base-content/60">UUID: {{ monitor.uuid }}</div>
                  </td>
                  <td>
                    <span
                      class="badge"
                      :class="monitor.alarmState ? 'badge-error' : 'badge-success'"
                    >
                      {{ monitor.alarmState ? 'ALARM' : 'OK' }}
                    </span>
                  </td>
                  <td>{{ monitor.intervalSeconds }}</td>
                  <td>
                    <span class="badge" :class="monitor.enabled ? 'badge-primary' : 'badge-ghost'">
                      {{ monitor.enabled ? 'Enabled' : 'Disabled' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="btn btn-ghost btn-xs"
                        @click="openMonitorModal('edit', monitor)"
                        aria-label="Edit monitor"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.862 4.487 19.5 7.125m0 0-9.9 9.9a4.5 4.5 0 0 1-1.591 1.04L6 18l-.065-1.995a4.5 4.5 0 0 1 1.04-1.591l9.9-9.9m3.625 3.625L21 6.75a2.25 2.25 0 0 0-3.182-3.182l-1.238 1.238"
                          />
                        </svg>
                      </button>
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        @click="handleMonitorDelete(monitor.uuid)"
                        aria-label="Delete monitor"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9.75 9.75 14.25 14.25M14.25 9.75 9.75 14.25M3.75 6H20.25M18 6 17.25 19.5a1.5 1.5 0 0 1-1.5 1.5H8.25a1.5 1.5 0 0 1-1.5-1.5L6 6"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-end gap-4" v-if="monitorPageCount > 1">
            <span class="text-sm text-base-content/70">
              Page {{ monitorPage }} of {{ monitorPageCount }}
            </span>
            <div class="join">
              <button
                class="btn btn-sm join-item"
                :disabled="monitorPage === 1"
                @click="monitorPage--"
              >
                «
              </button>
              <button
                class="btn btn-sm join-item"
                :disabled="monitorPage === monitorPageCount"
                @click="monitorPage++"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="card bg-base-100 shadow-xl">
        <div class="card-body gap-6">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="card-title">Notifications</h2>
              <p class="text-sm text-base-content/70">
                Manage notification channels assigned to your groups.
              </p>
            </div>
            <button
              class="btn btn-secondary"
              data-test="add-notification"
              @click="openNotificationModal('create')"
            >
              Add Notification
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Groups</th>
                  <th class="w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="notificationLoading">
                  <td colspan="3">
                    <div class="flex justify-center py-6">
                      <span class="loading loading-spinner loading-md"></span>
                    </div>
                  </td>
                </tr>
                <tr
                  v-else-if="!visibleNotifications.length"
                  class="text-center text-base-content/70"
                >
                  <td colspan="3">No notifications configured.</td>
                </tr>
                <tr
                  v-for="notification in visibleNotifications"
                  :key="notification.id"
                  data-test="notification-row"
                >
                  <td>{{ notification.name }}</td>
                  <td class="flex flex-wrap gap-2">
                    <span
                      v-for="groupId in notification.groupIds"
                      :key="groupId"
                      class="badge badge-outline"
                    >
                      {{ groupName(groupId) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="btn btn-ghost btn-xs"
                        @click="openNotificationModal('edit', notification)"
                        aria-label="Edit notification"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.862 4.487 19.5 7.125m0 0-9.9 9.9a4.5 4.5 0 0 1-1.591 1.04L6 18l-.065-1.995a4.5 4.5 0 0 1 1.04-1.591l9.9-9.9m3.625 3.625L21 6.75a2.25 2.25 0 0 0-3.182-3.182l-1.238 1.238"
                          />
                        </svg>
                      </button>
                      <button
                        class="btn btn-ghost btn-xs text-error"
                        @click="handleNotificationDelete(notification.id)"
                        aria-label="Delete notification"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="size-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9.75 9.75 14.25 14.25M14.25 9.75 9.75 14.25M3.75 6H20.25M18 6 17.25 19.5a1.5 1.5 0 0 1-1.5 1.5H8.25a1.5 1.5 0 0 1-1.5-1.5L6 6"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-end gap-4" v-if="notificationPageCount > 1">
            <span class="text-sm text-base-content/70">
              Page {{ notificationPage }} of {{ notificationPageCount }}
            </span>
            <div class="join">
              <button
                class="btn btn-sm join-item"
                :disabled="notificationPage === 1"
                @click="notificationPage--"
              >
                «
              </button>
              <button
                class="btn btn-sm join-item"
                :disabled="notificationPage === notificationPageCount"
                @click="notificationPage++"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- Group Modal -->
  <div v-if="groupModal.open" class="modal modal-open" data-test="group-modal">
    <div class="modal-box w-11/12 max-w-md">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">
          {{ groupModal.mode === 'create' ? 'Add Group' : 'Edit Group' }}
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="closeGroupModal">✕</button>
      </div>
      <form class="mt-6 space-y-4" @submit.prevent="handleGroupSubmit">
        <div class="form-control space-y-2">
          <label class="label py-0"><span class="label-text font-medium">Group Name</span></label>
          <input
            class="input input-bordered"
            v-model="groupModal.form.name"
            placeholder="Operations"
            required
          />
        </div>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeGroupModal">Cancel</button>
          <button class="btn btn-accent" type="submit">
            {{ groupModal.mode === 'create' ? 'Create Group' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Monitor Modal -->
  <div
    v-if="monitorModal.open"
    class="modal modal-open"
    data-test="monitor-modal"
  >
    <div class="modal-box w-11/12 max-w-2xl">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">
          {{ monitorModal.mode === 'create' ? 'Add Monitor' : 'Edit Monitor' }}
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="closeMonitorModal">✕</button>
      </div>
      <form class="mt-6 space-y-5" @submit.prevent="handleMonitorSubmit">
        <div class="form-control space-y-3">
          <label class="label py-0"><span class="label-text font-medium">Name</span></label>
          <input
            class="input input-bordered"
            v-model="monitorModal.form.name"
            placeholder="API uptime"
            required
          />
        </div>

        <div class="form-control space-y-3" v-if="monitorModal.mode === 'edit'">
          <label class="label py-0"><span class="label-text font-medium">Monitor UUID</span></label>
          <input
            class="input input-bordered"
            :value="monitorModal.form.uuid"
            disabled
          />
        </div>

        <div class="form-control space-y-3">
          <label class="label py-0"><span class="label-text font-medium">Group</span></label>
          <select class="select select-bordered" v-model="monitorModal.form.groupId" required>
            <option value="" disabled>Select a group</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="form-control space-y-2">
            <label class="label py-0"><span class="label-text font-medium">Interval (seconds)</span></label>
            <input
              type="number"
              min="1"
              class="input input-bordered"
              v-model.number="monitorModal.form.intervalSeconds"
              required
            />
          </div>
          <div class="form-control">
            <span class="label-text font-medium mb-2 block">Flags</span>
            <div class="flex flex-col gap-3">
              <label class="label justify-between rounded-lg border border-base-200 px-3 py-2">
                <span class="label-text">Enabled</span>
                <input type="checkbox" class="toggle" v-model="monitorModal.form.enabled" />
              </label>
              <label class="label justify-between rounded-lg border border-base-200 px-3 py-2">
                <span class="label-text">Alarm State</span>
                <input
                  type="checkbox"
                  class="toggle toggle-error"
                  v-model="monitorModal.form.alarmState"
                />
              </label>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeMonitorModal">Cancel</button>
          <button class="btn btn-primary" type="submit">
            {{ monitorModal.mode === 'create' ? 'Create Monitor' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Notification Modal -->
  <div
    v-if="notificationModal.open"
    class="modal modal-open"
    data-test="notification-modal"
  >
    <div class="modal-box w-11/12 max-w-xl">
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">
          {{ notificationModal.mode === 'create' ? 'Add Notification' : 'Edit Notification' }}
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost" @click="closeNotificationModal">✕</button>
      </div>
      <form class="mt-6 space-y-4" @submit.prevent="handleNotificationSubmit">
        <div class="form-control">
          <label class="label"><span class="label-text">Name</span></label>
          <input
            class="input input-bordered"
            v-model="notificationModal.form.name"
            placeholder="PagerDuty"
            required
          />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Assigned Groups</span></label>
          <div class="max-h-48 overflow-y-auto space-y-2">
            <label
              v-for="group in groups"
              :key="group.id"
              class="label cursor-pointer justify-between rounded-lg border border-base-200 px-3 py-2"
            >
              <span>{{ group.name }}</span>
              <input
                type="checkbox"
                class="checkbox"
                :value="group.id"
                v-model="notificationModal.form.groupIds"
              />
            </label>
            <p v-if="!groups.length" class="text-sm text-base-content/70">
              No groups available. Create a group via the API to proceed.
            </p>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeNotificationModal">
            Cancel
          </button>
          <button class="btn btn-secondary" type="submit">
            {{ notificationModal.mode === 'create' ? 'Create Notification' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  createGroup,
  createMonitor,
  createNotification,
  deleteGroup,
  deleteMonitor,
  deleteNotification,
  fetchGroups,
  fetchMonitors,
  fetchNotifications,
  updateGroup,
  updateMonitor,
  updateNotification,
  type Group,
  type Monitor,
  type Notification,
} from './services/api';

const DEFAULT_USER_ID = '74bad85b-f378-4bda-8762-e44abffd9228';
const THEME_STORAGE_KEY = 'missed-monitor-theme';
const PAGE_SIZE = 5;

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Emerald', value: 'emerald' },
  { label: 'Business', value: 'business' },
  { label: 'Aqua', value: 'aqua' },
  { label: 'Nord', value: 'nord' },
  { label: 'Lemonade', value: 'lemonade' },
  { label: 'Dim', value: 'dim' },
];

const groups = ref<Group[]>([]);
const monitors = ref<Monitor[]>([]);
const notifications = ref<Notification[]>([]);
const monitorLoading = ref(false);
const notificationLoading = ref(false);
const groupLoading = ref(false);
const errorMessage = ref('');
const monitorPage = ref(1);
const notificationPage = ref(1);
const selectedTheme = ref(themeOptions[0].value);

const monitorModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  form: {
    uuid: '',
    name: '',
    userId: DEFAULT_USER_ID,
    groupId: '',
    enabled: true,
    intervalSeconds: 60,
    alarmState: false,
  },
});

const notificationModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  form: {
    id: '',
    name: '',
    userId: DEFAULT_USER_ID,
    groupIds: [] as string[],
  },
});

const visibleMonitors = computed(() => {
  const start = (monitorPage.value - 1) * PAGE_SIZE;
  return monitors.value.slice(start, start + PAGE_SIZE);
});

const visibleNotifications = computed(() => {
  const start = (notificationPage.value - 1) * PAGE_SIZE;
  return notifications.value.slice(start, start + PAGE_SIZE);
});

const monitorPageCount = computed(() => Math.max(1, Math.ceil(monitors.value.length / PAGE_SIZE)) || 1);
const notificationPageCount = computed(
  () => Math.max(1, Math.ceil(notifications.value.length / PAGE_SIZE)) || 1,
);

const groupsWithCounts = computed(() =>
  groups.value.map((group) => ({
    ...group,
    monitorCount: monitors.value.filter((monitor) => monitor.groupId === group.id).length,
  })),
);

const groupModal = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  form: {
    id: '',
    name: '',
    userId: DEFAULT_USER_ID,
  },
});

watch(
  () => monitors.value.length,
  () => {
    if (monitorPage.value > monitorPageCount.value) {
      monitorPage.value = monitorPageCount.value;
    }
  },
);

watch(
  () => notifications.value.length,
  () => {
    if (notificationPage.value > notificationPageCount.value) {
      notificationPage.value = notificationPageCount.value;
    }
  },
);

watch(
  groups,
  (newGroups) => {
    if (newGroups.length) {
      if (!newGroups.some((group) => group.id === monitorModal.form.groupId)) {
        monitorModal.form.groupId = newGroups[0].id;
      }
      const filtered = notificationModal.form.groupIds.filter((id) =>
        newGroups.some((group) => group.id === id),
      );
      notificationModal.form.groupIds = filtered.length ? filtered : [newGroups[0].id];
    } else {
      monitorModal.form.groupId = '';
      notificationModal.form.groupIds = [];
    }
  },
  { immediate: true },
);

const showError = (message: string) => {
  errorMessage.value = message;
  setTimeout(() => {
    if (errorMessage.value === message) {
      errorMessage.value = '';
    }
  }, 5000);
};

const loadGroups = async () => {
  try {
    groupLoading.value = true;
    groups.value = await fetchGroups();
  } catch (error) {
    console.error(error);
    showError('Unable to load groups');
  } finally {
    groupLoading.value = false;
  }
};

const loadMonitors = async () => {
  try {
    monitorLoading.value = true;
    monitors.value = await fetchMonitors();
  } catch (error) {
    console.error(error);
    showError('Unable to load monitors');
  } finally {
    monitorLoading.value = false;
  }
};

const loadNotifications = async () => {
  try {
    notificationLoading.value = true;
    notifications.value = await fetchNotifications();
  } catch (error) {
    console.error(error);
    showError('Unable to load notifications');
  } finally {
    notificationLoading.value = false;
  }
};

const reloadAll = async () => {
  await Promise.all([loadGroups(), loadMonitors(), loadNotifications()]);
};

const generateUuidValue = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const resetMonitorForm = () => {
  monitorModal.form = {
    uuid: generateUuidValue(),
    name: '',
    userId: DEFAULT_USER_ID,
    groupId: groups.value[0]?.id ?? '',
    enabled: true,
    intervalSeconds: 60,
    alarmState: false,
  };
};

const openMonitorModal = (mode: 'create' | 'edit', monitor?: Monitor) => {
  monitorModal.mode = mode;
  if (mode === 'edit' && monitor) {
    monitorModal.form = {
      uuid: monitor.uuid,
      name: monitor.name,
      userId: monitor.userId,
      groupId: monitor.groupId,
      enabled: monitor.enabled,
      intervalSeconds: monitor.intervalSeconds,
      alarmState: monitor.alarmState,
    };
  } else {
    resetMonitorForm();
  }
  monitorModal.open = true;
};

const closeMonitorModal = () => {
  monitorModal.open = false;
};

const handleMonitorSubmit = async () => {
  if (!monitorModal.form.groupId) {
    showError('Select a group before saving');
    return;
  }

  const payload = {
    name: monitorModal.form.name.trim(),
    userId: DEFAULT_USER_ID,
    groupId: monitorModal.form.groupId,
    enabled: monitorModal.form.enabled,
    intervalSeconds: monitorModal.form.intervalSeconds,
    alarmState: monitorModal.form.alarmState,
  };

  try {
    if (monitorModal.mode === 'create') {
      if (!monitorModal.form.uuid) {
        monitorModal.form.uuid = generateUuidValue();
      }
      await createMonitor({
        uuid: monitorModal.form.uuid,
        ...payload,
        userId: DEFAULT_USER_ID,
      });
    } else {
      await updateMonitor(monitorModal.form.uuid, payload);
    }
    closeMonitorModal();
    await loadMonitors();
  } catch (error) {
    console.error(error);
    showError('Unable to save monitor');
  }
};

const handleMonitorDelete = async (uuid: string) => {
  if (!confirm('Delete this monitor?')) {
    return;
  }
  try {
    await deleteMonitor(uuid);
    await loadMonitors();
  } catch (error) {
    console.error(error);
    showError('Unable to delete monitor');
  }
};

const resetNotificationForm = () => {
  notificationModal.form = {
    id: '',
    name: '',
    userId: DEFAULT_USER_ID,
    groupIds: groups.value[0] ? [groups.value[0].id] : [],
  };
};

const openNotificationModal = (mode: 'create' | 'edit', notification?: Notification) => {
  notificationModal.mode = mode;
  if (mode === 'edit' && notification) {
    notificationModal.form = {
      id: notification.id,
      name: notification.name,
      userId: notification.userId,
      groupIds: [...notification.groupIds],
    };
  } else {
    resetNotificationForm();
  }
  notificationModal.open = true;
};

const closeNotificationModal = () => {
  notificationModal.open = false;
};

const handleNotificationSubmit = async () => {
  if (!notificationModal.form.groupIds.length) {
    showError('Select at least one group for the notification');
    return;
  }

  const payload = {
    name: notificationModal.form.name.trim(),
    userId: DEFAULT_USER_ID,
    groupIds: [...notificationModal.form.groupIds],
  };

  try {
    if (notificationModal.mode === 'create') {
      await createNotification(payload);
    } else {
      await updateNotification(notificationModal.form.id, payload);
    }
    closeNotificationModal();
    await loadNotifications();
  } catch (error) {
    console.error(error);
    showError('Unable to save notification');
  }
};

const handleNotificationDelete = async (id: string) => {
  if (!confirm('Delete this notification?')) {
    return;
  }
  try {
    await deleteNotification(id);
    await loadNotifications();
  } catch (error) {
    console.error(error);
    showError('Unable to delete notification');
  }
};

const groupName = (groupId: string) => groups.value.find((group) => group.id === groupId)?.name ?? 'Unknown';

const resetGroupForm = () => {
  groupModal.form = {
    id: '',
    name: '',
    userId: DEFAULT_USER_ID,
  };
};

const openGroupModal = (mode: 'create' | 'edit', group?: Group & { monitorCount?: number }) => {
  groupModal.mode = mode;
  if (mode === 'edit' && group) {
    groupModal.form = {
      id: group.id,
      name: group.name,
      userId: group.userId,
    };
  } else {
    resetGroupForm();
  }
  groupModal.open = true;
};

const closeGroupModal = () => {
  groupModal.open = false;
};

const handleGroupSubmit = async () => {
  if (!groupModal.form.name.trim()) {
    showError('Group name is required');
    return;
  }

  const payload = {
    name: groupModal.form.name.trim(),
    userId: DEFAULT_USER_ID,
  };

  try {
    if (groupModal.mode === 'create') {
      await createGroup(payload);
    } else {
      await updateGroup(groupModal.form.id, payload);
    }
    closeGroupModal();
    await loadGroups();
  } catch (error) {
    console.error(error);
    showError('Unable to save group');
  }
};

const handleGroupDelete = async (groupId: string, monitorCount: number) => {
  if (monitorCount > 0) {
    showError('Remove monitors from this group before deleting it.');
    return;
  }
  if (!confirm('Delete this group?')) {
    return;
  }
  try {
    await deleteGroup(groupId);
    await loadGroups();
  } catch (error) {
    console.error(error);
    showError('Unable to delete group');
  }
};

const applyTheme = (theme: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    document.body?.setAttribute('data-theme', theme);
  }
};

const initializeTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && themeOptions.some((theme) => theme.value === stored)) {
      selectedTheme.value = stored;
    } else {
      const systemIsDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      selectedTheme.value = systemIsDark ? 'dark' : themeOptions[0].value;
    }
  } catch {
    selectedTheme.value = themeOptions[0].value;
  }
  applyTheme(selectedTheme.value);
};

watch(selectedTheme, (theme) => {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage issues
  }
});

onMounted(() => {
  initializeTheme();
  reloadAll();
});

onUnmounted(() => {
  // No-op
});
</script>

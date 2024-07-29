<template>
  <div class="relative">
    <div class="absolute top-0 right-0 mt-4 mr-4" style="z-index: 1;">
      <select id="day-select" v-model="selectedDay" @change="fetchSalesOverview" class="w-32 p-1 border-none rounded text-sm">
        <option value="7">7 Days</option>
        <option value="14">14 Days</option>
        <option value="30">30 Days</option>
        <option value="60">60 Days</option>
      </select>
    </div>
    <div v-if="loading" class="text-center">
      <div class="spinner"></div>
    </div>
    <div v-else>
      <ChartComponent :salesOverview="salesOverview" :selectedDay="Number(selectedDay)" />
    </div>
    <Overlay v-if="!isAuthenticated" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import Overlay from '../components/UnAuthorizedOverlay.vue';
import ChartComponent from '../components/ChartComponent.vue';

const selectedDay = ref(7);
const store = useStore();

const fetchSalesOverview = async () => {
  await store.dispatch('auth/fetchSalesOverview', Number(selectedDay.value));
};

onMounted(async () => {
  store.dispatch('auth/checkAuthentication');
  if (store.getters['auth/isAuthenticated']) {
    await fetchSalesOverview();
  }
});

watch(selectedDay, async () => {
  if (store.getters['auth/isAuthenticated']) {
    await fetchSalesOverview();
  }
});

const loading = computed(() => store.getters['auth/loading']);
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const salesOverview = computed(() => store.getters['auth/salesOverview']);
</script>

<style scoped>
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1); /* Light grey background */
  border-radius: 50%;
  border-top: 4px solid #3498db; /* Blue color */
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

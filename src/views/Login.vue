<template>
  <div class="flex items-center justify-center h-screen">
    <div class="max-w-md w-full bg-white p-8 shadow-md rounded-lg">
      <form @submit.prevent="login">
        <div class="mb-4">
          <label for="email" class="block mb-2">Email:</label>
          <input type="email" v-model="email" required class="w-full p-2 border border-gray-300 rounded" />
        </div>
        <div class="mb-4">
          <label for="password" class="block mb-2">Password:</label>
          <input type="password" v-model="password" required class="w-full p-2 border border-gray-300 rounded" />
        </div>
        <button type="submit" :disabled="loading" class="w-full p-2 bg-gray-800 text-white rounded cursor-pointer disabled:bg-gray-600">Login</button>
      </form>
      <div v-if="error" class="text-red-500 mt-4 text-center">{{ error.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const store = useStore();
const router = useRouter();

const loading = computed(() => store.getters.loading);
const error = computed(() => store.getters.error);
const login = async () => {
  await store.dispatch('login', { email: email.value, password: password.value });
  if (!error.value) {
    router.push('/dashboard');
  }
};

onMounted(() => {
  if (store.getters.isAuthenticated) {
    router.push('/dashboard');
  }
});
</script>

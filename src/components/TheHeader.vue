<template>
  <header class="bg-gray-800 text-white p-4">
    <div class="container mx-auto flex justify-between items-center">
      <router-link to="/" class="text-xl font-bold">MyApp</router-link>
      <nav>
        <ul class="flex space-x-4">
          <li><router-link to="/" class="hover:underline">Home</router-link></li>
          <li><router-link to="/dashboard" class="hover:underline">Dashboard</router-link></li>
          <li v-if="!isAuthenticated"><router-link to="/login" class="hover:underline">Login</router-link></li>
          <li v-if="isAuthenticated"><button @click="logout" class="hover:underline">Logout</button></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const isAuthenticated = computed(() => store.getters['isAuthenticated']);

const logout = () => {
  store.dispatch('logout');
  router.push('/');
};
</script>

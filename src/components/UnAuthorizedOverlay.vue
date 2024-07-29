<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 backdrop-blur-xl">
    <div class="bg-white p-8 rounded shadow-md text-center">
      <h2 class="text-2xl mb-4">Please Login</h2>
      <div class="flex justify-center space-x-4">
        <button @click="redirectToHome" class="bg-blue-500 text-white px-4 py-2 rounded">Go to Home</button>
        <button @click="redirectToLogin" class="bg-blue-500 text-white px-4 py-2 rounded">Go to Login</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const redirectToLogin = () => {
  router.push('/login');
};

const redirectToHome = () => {
  router.push('/');
};
</script>

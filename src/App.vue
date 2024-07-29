<template>
  <div id="app">
    <Header />
    <main class="p-4">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Header from './components/TheHeader.vue';
</script>

<style scoped>
main {
  padding-top: 4rem;
}
</style>

<template>
  <div class="flex justify-start mb-4">
    <input 
      v-model="searchQuery"
      @input="handleInput"
      type="text" 
      placeholder="Search SKU or Product Name"
      class="px-4 py-2 border rounded"
    />
  </div>
</template>

<script setup>
import { defineEmits, ref } from "vue";
import { useStore } from 'vuex';

const emit = defineEmits(["update:filteredSkuList"]);
const searchQuery = ref("");
const store = useStore();

const handleInput = () => {
  const filteredResults = filterTable(searchQuery.value);
  emit("update:filteredSkuList", filteredResults);
};

const filterTable = (query) => {
  if (query.trim() === "") {
    return store.getters['sales/skuList'];
  } else {
    const lowerCaseQuery = query.toLowerCase();
    return store.getters['sales/skuList'].filter((item) =>
      item.sku.toLowerCase().includes(lowerCaseQuery) ||
      item.productName.toLowerCase().includes(lowerCaseQuery)
    );
  }
};
</script>

<style scoped>
</style>

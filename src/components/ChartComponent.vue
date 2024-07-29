<template>
  <div>
    <div ref="chartContainer" id="container"></div>
    <div v-if="chartState.showTable && chartState.filteredSkuList.length > 0" class="mt-4">
      <SearchBar @update:filteredSkuList="updateFilteredSkuList" />
      <table class="w-full border-collapse table-striped">
        <thead>
          <tr>
            <th class="px-4 py-2">SKU</th>
            <th class="px-4 py-2">Product Name</th>
            <th class="px-4 py-2" v-html="tableHeader"></th>
            <th v-if="chartState.selectedBars.length === 2" class="px-4 py-2" v-html="secondTableHeader"></th>
            <th class="px-4 py-2">SKU Refund Rate (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in displayedSkuList" :key="item.sku">
            <td class="px-4 py-2">{{ item.sku }}</td>
            <td class="px-4 py-2">{{ item.productName }}</td>
            <td class="px-4 py-2 text-right">
              ${{ item.sales !== null && !isNaN(item.sales) ? item.sales.toFixed(2) : '--' }} / 
              {{ item.units !== null && !isNaN(item.units) ? item.units : '--' }} <br />
              ${{ item.sales !== null && item.units !== null && !isNaN(item.sales) && !isNaN(item.units) && item.units !== 0 ? (item.sales / item.units).toFixed(2) : '0' }}
            </td>
            <td v-if="chartState.selectedBars.length === 2" class="px-4 py-2 text-right">
              ${{ item.sales2 !== null && !isNaN(item.sales2) ? item.sales2.toFixed(2) : '--' }} / 
              {{ item.units2 !== null && !isNaN(item.units2) ? item.units2 : '--' }} <br />
              ${{ item.sales2 !== null && item.units2 !== null && !isNaN(item.sales2) && !isNaN(item.units2) && item.units2 !== 0 ? (item.sales2 / item.units2).toFixed(2) : '0' }} <br />
              <span :class="getUnitsDifferenceClass(item.unitsDifference)">
                {{ item.unitsDifference !== null && !isNaN(item.unitsDifference) ? item.unitsDifference : '--' }}
                <template v-if="item.unitsDifference !== null && !isNaN(item.unitsDifference)">
                  <span v-if="item.unitsDifference > 0" class="text-green-500">▲</span>
                  <span v-else-if="item.unitsDifference < 0" class="text-red-500">▼</span>
                </template>
              </span>
            </td>
            <td class="px-4 py-2 text-right">
              {{ item.refundRate !== null && !isNaN(item.refundRate) ? item.refundRate : '0' }}
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-end items-center mt-4 pagination-container">
        <button
          @click="previousPage"
          :disabled="chartState.currentPage === 1"
          class="px-2 py-1 bg-gray-300 rounded"
        >
          &laquo;
        </button>
        <div class="flex items-center mx-2">
          <span v-for="page in totalPages" :key="page">
            <button
              @click="goToPage(page)"
              :class="{'font-bold': chartState.currentPage === page, 'px-2': true}"
              class="mx-1"
            >
              {{ page }}
            </button>
          </span>
        </div>
        <button
          @click="nextPage"
          class="px-2 py-1 bg-gray-300 rounded"
        >
          &raquo;
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted, watch, computed } from "vue";
import { useStore } from 'vuex';
import Highcharts from "highcharts";
import HighchartsAccessibility from "highcharts/modules/accessibility";
import SearchBar from './SearchBar.vue';
import { formatDate } from '../composables/DataFormatter';
import '../assets/ChartStyles.css';

HighchartsAccessibility(Highcharts);

const props = defineProps({
  salesOverview: Array,
  selectedDay: Number,
});

const store = useStore();

const chartState = reactive({
  chartContainer: null,
  selectedBars: [],
  currentPage: 1,
  pageSize: 10,
  showTable: false,
  searchQuery: "",
  filteredSkuList: [],
  defaultColors: {
    fba: null,
    fbm: null,
    profit: null,
  },
  clickedBarColor: null,
});

const chartOptions = ref({
  chart: {
    type: "column",
    backgroundColor: "transparent",
  },
  title: {
    text: "Daily Sales",
    align: "left",
    style: {
      fontWeight: "bold",
      fontSize: "20px",
    },
  },
  xAxis: {
    categories: [],
    labels: {
      style: {
        fontSize: "12px",
      },
    },
  },
  yAxis: {
    title: {
      text: "Amount ($)",
      style: {
        fontSize: "14px",
      },
    },
  },
  tooltip: {
    useHTML: true,
    formatter: function () {
      return `
        <div style="display: flex; width: 100%; justify-content: center">
          <b>${this.x}</b><br/><br/>
        </div>
        <div style="display: flex; justify-content: center; min-width: 200px; max-width: 400px;">
          <div style="width: 50%; text-align: left;">
            Total Sales:<br/>
            Shipping:<br/>
            Profit:<br/>
            FBA Sales:<br/>
            FBM Sales:<br/>
          </div>
          <div style="width: 50%; text-align: right;">
            $${(this.point.fbaAmount + this.point.fbmAmount).toFixed(2)}<br/>
            $${this.point.fbaShippingAmount.toFixed(2)}<br/>
            $${this.point.profit.toFixed(2)}<br/>
            $${this.point.fbaAmount.toFixed(2)}<br/>
            $${this.point.fbmAmount.toFixed(2)}<br/>
          </div>
        </div>
      `;
    },
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    style: {
      color: "#ffffff",
    },
  },
  plotOptions: {
    column: {
      stacking: "normal",
      dataLabels: {
        enabled: true,
        color: "#000000",
        style: {
          textOutline: "none",
          fontSize: "12px",
        },
      },
      point: {
        events: {
          click: function () {
            handleBarClick(this);
          },
        },
      },
    },
  },
  series: [
    {
      name: "FBA Sales",
      data: [],
      stack: "sales",
      color: chartState.defaultColors.fba,
    },
    {
      name: "FBM Sales",
      data: [],
      stack: "sales",
      color: chartState.defaultColors.fbm,
    },
    {
      name: "Profit",
      data: [],
      stack: "sales",
      color: chartState.defaultColors.profit,
    },
  ],
});

const colorMap = computed(() => {
  return {
    "FBA Sales": chartState.defaultColors.fba,
    "FBM Sales": chartState.defaultColors.fbm,
    "Profit": chartState.defaultColors.profit,
  };
});

const getDefaultColor = (seriesName) => {
  return colorMap.value[seriesName] || defaultBarColor;
};

const initializeChart = () => {
  if (!chartState.chartContainer) return;

  const container = chartState.chartContainer;
  const style = getComputedStyle(container);

  chartState.defaultColors.fba = style.getPropertyValue('--fba-color').trim();
  chartState.defaultColors.fbm = style.getPropertyValue('--fbm-color').trim();
  chartState.defaultColors.profit = style.getPropertyValue('--profit-color').trim();
  chartState.clickedBarColor = style.getPropertyValue('--clicked-bar-color').trim();

  renderChart();
};

onMounted(() => {
  chartState.chartContainer = document.getElementById('container');
  initializeChart();
});

const renderChart = () => {
  if (props.salesOverview.length && chartState.chartContainer) {
    const categories = props.salesOverview.map((item) => formatDate(item.date));
    const fbaData = props.salesOverview.map((item) => ({
      y: item.fbaAmount,
      fbaAmount: item.fbaAmount,
      fbmAmount: item.fbmAmount,
      fbaShippingAmount: item.fbaShippingAmount,
      profit: item.profit,
    }));
    const fbmData = props.salesOverview.map((item) => ({
      y: item.fbmAmount,
      fbaAmount: item.fbaAmount,
      fbmAmount: item.fbmAmount,
      fbaShippingAmount: item.fbaShippingAmount,
      profit: item.profit,
    }));
    const profitData = props.salesOverview.map((item) => ({
      y: item.profit,
      fbaAmount: item.fbaAmount,
      fbmAmount: item.fbmAmount,
      fbaShippingAmount: item.fbaShippingAmount,
      profit: item.profit,
    }));

    chartOptions.value.xAxis.categories = categories;
    chartOptions.value.series[0].data = fbaData;
    chartOptions.value.series[1].data = fbmData;
    chartOptions.value.series[2].data = profitData;

    Highcharts.chart(chartState.chartContainer, chartOptions.value);
  }
};

const handleBarClick = (point) => {
  const category = point.category;

  if (chartState.selectedBars.includes(category)) {
    chartState.selectedBars = chartState.selectedBars.filter((bar) => bar !== category);
    point.update({ color: getDefaultColor(point.series.name) }, true, false);
    if (chartState.selectedBars.length > 0) {
      fetchTableData();
    } else {
      chartState.showTable = false;
    }
  } else {
    if (chartState.selectedBars.length < 2) {
      chartState.selectedBars.push(category);
      point.update({ color: chartState.clickedBarColor }, true, false);
      fetchTableData();
    }
  }
};

const fetchTableData = () => {
  store.dispatch('sales/fetchSkuList', {
    selectedBars: chartState.selectedBars,
    salesOverview: props.salesOverview,
    selectedDay: props.selectedDay,
    currentPage: chartState.currentPage,
  }).then(() => {
    chartState.filteredSkuList = store.getters['sales/skuList'];
    chartState.showTable = true;
  });
};

const getUnitsDifferenceClass = (unitsDifference) => {
  return unitsDifference > 0 ? "text-green-500" : "text-red-500";
};

const updateFilteredSkuList = (filteredResults) => {
  chartState.filteredSkuList = filteredResults;
  chartState.currentPage = 1;
};

const displayedSkuList = computed(() => {
  const start = (chartState.currentPage - 1) * chartState.pageSize;
  const end = start + chartState.pageSize;
  return chartState.filteredSkuList.slice(start, end);
});


const totalPages = computed(() => {
  return Math.ceil(chartState.filteredSkuList.length / chartState.pageSize);
});

const nextPage = async () => {
  if (chartState.currentPage < totalPages.value) {
    chartState.currentPage += 1;
  } else {
    await fetchMoreData();
  }
};

const previousPage = () => {
  if (chartState.currentPage > 1) {
    chartState.currentPage -= 1;
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    chartState.currentPage = page;
  }
};

const fetchMoreData = async () => {
  chartState.loading = true;
  try {
    await store.dispatch('sales/fetchSkuList', {
      selectedBars: chartState.selectedBars,
      salesOverview: props.salesOverview,
      selectedDay: props.selectedDay,
      currentPage: chartState.currentPage + 1,
    });
    const newFilteredSkuList = store.getters['sales/skuList'];
    chartState.filteredSkuList = chartState.filteredSkuList.concat(newFilteredSkuList);
    chartState.totalPages = Math.ceil(chartState.filteredSkuList.length / chartState.pageSize);
    chartState.currentPage += 1; 
  } catch (error) {
    console.error('Error fetching more data:', error);
  } finally {
    chartState.loading = false;
  }
};





watch(
  () => props.salesOverview,
  () => {
    renderChart();
  },
  { deep: true }
);

const selectedDate = computed(() => store.getters['sales/selectedDate']);
const selectedDate2 = computed(() => store.getters['sales/selectedDate2']);

const tableHeader = computed(() => {
  return `${selectedDate.value} <br> Sales / Units <br> Avg. Sales Price`;
});

const secondTableHeader = computed(() => {
  return `${selectedDate2.value} <br> Sales / Units <br> Avg. Sales Price`;
});
</script>

<style scoped>
@import '../assets/ChartStyles.css';
@import '../assets/PaginationStyles.css';
@import '../assets/TableStyles.css';

</style>

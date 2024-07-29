import {
  getDailySalesSkuList,
  getSkuRefundRate,
  getDailySalesOverview,
} from "/src/services/api.js";
import { formatDate } from "/src/composables/DataFormatter.js";

const state = {
  skuList: [],
  selectedDate: "",
  selectedDate2: "",
  salesOverview: [],
  isAuthenticated: false,
  loading: false,
  selectedDay: 7,
  user: null,
};

const mutations = {
  SET_SKU_LIST(state, skuList) {
    state.skuList = skuList;
  },
  SET_SELECTED_DATES(state, { selectedDate, selectedDate2 }) {
    state.selectedDate = selectedDate;
    state.selectedDate2 = selectedDate2;
  },
  SET_SALES_OVERVIEW(state, salesOverview) {
    state.salesOverview = salesOverview;
  },
  SET_AUTHENTICATION(state, isAuthenticated) {
    state.isAuthenticated = isAuthenticated;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_SELECTED_DAY(state, selectedDay) {
    state.selectedDay = selectedDay;
  },
  SET_USER(state, user) {
    state.user = user;
  },
};

const actions = {
  checkAuthentication({ commit }) {
    const accessToken = localStorage.getItem("accessToken");
    const user = JSON.parse(localStorage.getItem("user"));
    commit("SET_AUTHENTICATION", !!accessToken);
    if (user) {
      commit("SET_USER", user);
    }
  },
  async fetchSalesOverview({ commit, state }) {
    commit("SET_LOADING", true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (
        user &&
        user.store &&
        Array.isArray(user.store) &&
        user.store.length > 0
      ) {
        const store = user.store[0];
        const marketplace = store.marketplaceName;
        const sellerId = store.storeId;

        const response = await getDailySalesOverview(
          localStorage.getItem("accessToken"),
          marketplace,
          sellerId,
          state.selectedDay
        );
        commit("SET_SALES_OVERVIEW", response.data.Data.item);
      } else {
        throw new Error("User store information is missing or malformed.");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        commit("SET_AUTHENTICATION", false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
      console.error("Error fetching sales overview:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },
  async fetchSkuList(
    { commit },
    { selectedBars, salesOverview, selectedDay, currentPage }
  ) {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (
        user &&
        user.store &&
        Array.isArray(user.store) &&
        user.store.length > 0
      ) {
        const store = user.store[0];
        const marketplace = store.marketplaceName;
        const sellerId = store.storeId;
        const salesDate =
          selectedBars.length > 0
            ? salesOverview.find(
                (item) => formatDate(item.date) === selectedBars[0]
              ).date
            : "";
        const salesDate2 =
          selectedBars.length === 2
            ? salesOverview.find(
                (item) => formatDate(item.date) === selectedBars[1]
              ).date
            : "";
        const isDaysCompare = selectedBars.length === 2 ? 1 : 0;

        const skuListResponse = await getDailySalesSkuList(
          localStorage.getItem("accessToken"),
          marketplace,
          sellerId,
          salesDate,
          salesDate2,
          30,
          Math.ceil(currentPage / 3),
          isDaysCompare
        );
        const skuListData = skuListResponse.Data.item.skuList;
        const selectedDate = formatDate(skuListResponse.Data.item.selectedDate);
        const selectedDate2 =
          selectedBars.length === 2
            ? formatDate(skuListResponse.Data.item.selectedDate2)
            : "";

        let refundRatesResponse = [];
        let refundRateMap = {};
        if (selectedBars.length === 2) {
          refundRatesResponse = await getSkuRefundRate(
            localStorage.getItem("accessToken"),
            marketplace,
            sellerId,
            skuListData,
            selectedDay
          );
          refundRatesResponse.Data.forEach((rate) => {
            refundRateMap[rate.sku.sku] = rate.refundRate;
          });
        }

        const skuList = skuListData.map((item) => ({
          sku: item.sku,
          productName: item.productName,
          date: selectedDate,
          sales: item.amount,
          units: item.qty,
          date2: selectedDate2,
          sales2: item.amount2,
          units2: item.qty2,
          unitsDifference: item.qty2 - item.qty,
          refundRate:
            selectedBars.length === 2 ? refundRateMap[item.sku] || "--" : "--",
        }));

        commit("SET_SKU_LIST", skuList);
        commit("SET_SELECTED_DATES", { selectedDate, selectedDate2 });
      } else {
        throw new Error("User store information is missing or malformed.");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        commit("SET_AUTHENTICATION", false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
      console.error("Error fetching table data:", error);
    }
  },
  updateSelectedDay({ commit, dispatch }, selectedDay) {
    commit("SET_SELECTED_DAY", selectedDay);
    dispatch("fetchSalesOverview");
  },
};

const getters = {
  skuList: (state) => state.skuList,
  selectedDate: (state) => state.selectedDate,
  selectedDate2: (state) => state.selectedDate2,
  salesOverview: (state) => state.salesOverview,
  isAuthenticated: (state) => state.isAuthenticated,
  loading: (state) => state.loading,
  selectedDay: (state) => state.selectedDay,
  user: (state) => state.user,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};

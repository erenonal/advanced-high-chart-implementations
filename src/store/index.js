import { createStore } from "vuex";
import {
  login as loginApi,
  getUserInformation,
  getDailySalesOverview,
  getDailySalesSkuList,
  getSkuRefundRate
} from "../services/api";
import sales from "./sales";
import auth from "./auth";

import { formatDate } from "../composables/DataFormatter";

const store = createStore({
  modules: {
    sales,
    auth,
  },
  state: {
    accessToken: localStorage.getItem("accessToken") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
    loading: false,
    error: null,
    salesOverview: null,
    skuList: [],
    selectedDate: "",
    selectedDate2: "",
  },
  mutations: {
    setAccessToken(state, token) {
      state.accessToken = token;
      if (token) {
        localStorage.setItem("accessToken", token);
      } else {
        localStorage.removeItem("accessToken");
      }
    },
    setUser(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
    setError(state, error) {
      state.error = error;
    },
    setSalesOverview(state, data) {
      state.salesOverview = data;
    },
    setSkuList(state, skuList) {
      state.skuList = skuList;
    },
    setSelectedDates(state, { selectedDate, selectedDate2 }) {
      state.selectedDate = selectedDate;
      state.selectedDate2 = selectedDate2;
    },
  },
  actions: {
    async login({ commit }, { email, password }) {
      commit("setLoading", true);
      commit("setError", null);
      try {
        const response = await loginApi(email, password);
        const accessToken = response.data.Data.AccessToken;
        commit("setAccessToken", accessToken);

        const userResponse = await getUserInformation(accessToken, email);
        const userData = userResponse.data.Data.user;
        commit("setUser", userData);
      } catch (error) {
        commit("setError", error.response ? error.response.data : error);
      } finally {
        commit("setLoading", false);
      }
    },
    async fetchDailySalesOverview({ commit, state }, day) {
      commit("setLoading", true);
      commit("setError", null);
      try {
        const user = state.user;

        if (user && user.store && user.store.length > 0) {
          const store = user.store[0];
          const marketplace = store.marketplaceName;
          const sellerId = store.storeId;

          const salesOverviewResponse = await getDailySalesOverview(
            state.accessToken,
            marketplace,
            sellerId,
            day
          );
          commit("setSalesOverview", salesOverviewResponse.data);
        } else {
          throw new Error("User store information is missing.");
        }
      } catch (error) {
        commit(
          "setError",
          error.response ? error.response.data : error.message
        );
      } finally {
        commit("setLoading", false);
      }
    },
    async fetchSkuList(
      { commit, state },
      { selectedBars, salesOverview, selectedDay, currentPage }
    ) {
      commit("setLoading", true);
      commit("setError", null);
      try {
        const user = state.user;

        if (user && user.store && user.store.length > 0) {
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
            state.accessToken,
            marketplace,
            sellerId,
            salesDate,
            salesDate2,
            30,
            Math.ceil(currentPage / 3),
            isDaysCompare
          );
          const skuListData = skuListResponse.Data.item.skuList;
          const selectedDate = formatDate(
            skuListResponse.Data.item.selectedDate
          );
          const selectedDate2 =
            selectedBars.length === 2
              ? formatDate(skuListResponse.Data.item.selectedDate2)
              : "";

          let refundRatesResponse = [];
          let refundRateMap = {};
          if (selectedBars.length === 2) {
            refundRatesResponse = await getSkuRefundRate(
              state.accessToken,
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
              selectedBars.length === 2
                ? refundRateMap[item.sku] || "--"
                : "--",
          }));

          commit("setSkuList", skuList);
          commit("setSelectedDates", { selectedDate, selectedDate2 });
        } else {
          throw new Error("User store information is missing.");
        }
      } catch (error) {
        commit("setError", error.response ? error.response.data : error);
      } finally {
        commit("setLoading", false);
      }
    },
    logout({ commit }) {
      commit("setAccessToken", null);
      commit("setUser", null);
      commit("setSalesOverview", null);
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    user: (state) => state.user,
    loading: (state) => state.loading,
    error: (state) => state.error,
    salesOverview: (state) => state.salesOverview,
    skuList: (state) => state.skuList,
    selectedDate: (state) => state.selectedDate,
    selectedDate2: (state) => state.selectedDate2,
  },
});

export default store;

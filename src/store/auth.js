import {
  login,
  getUserInformation,
  getDailySalesOverview,
} from "../services/api";

const state = {
  accessToken: localStorage.getItem("accessToken") || "",
  user: JSON.parse(localStorage.getItem("user")) || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  salesOverview: [],
  loading: false,
};

const getters = {
  isAuthenticated: (state) => state.isAuthenticated,
  user: (state) => state.user,
  accessToken: (state) => state.accessToken,
  salesOverview: (state) => state.salesOverview,
  loading: (state) => state.loading,
};

const actions = {
  async fetchSalesOverview({ commit, state }, day) {
    try {
      commit("setLoading", true);
      const store = state.user.store[0];
      const response = await getDailySalesOverview(
        state.accessToken,
        store.marketplaceName,
        store.storeId,
        day
      );
      commit("setSalesOverview", response.data.Data.item);
    } catch (error) {
      console.error("Error fetching sales overview:", error);
    } finally {
      commit("setLoading", false);
    }
  },
  checkAuthentication({ commit }) {
    const accessToken = localStorage.getItem("accessToken");
    const user = JSON.parse(localStorage.getItem("user"));
    commit("setAccessToken", accessToken);
    commit("setUser", user);
    commit("setIsAuthenticated", !!accessToken);
  },
};

const mutations = {
  setAccessToken(state, accessToken) {
    state.accessToken = accessToken;
    localStorage.setItem("accessToken", accessToken);
  },
  setUser(state, user) {
    state.user = user;
    localStorage.setItem("user", JSON.stringify(user));
  },
  setIsAuthenticated(state, isAuthenticated) {
    state.isAuthenticated = isAuthenticated;
  },
  setSalesOverview(state, salesOverview) {
    state.salesOverview = salesOverview;
  },
  setLoading(state, loading) {
    state.loading = loading;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};

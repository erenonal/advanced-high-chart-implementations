import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import HighchartsVue from "highcharts-vue";

const app = createApp(App);

app.use(store);
app.use(router);
app.use(HighchartsVue);
app.mount("#app");

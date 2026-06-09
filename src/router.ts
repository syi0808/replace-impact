import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import MethodologyPage from "./pages/MethodologyPage.vue";
import PackagePage from "./pages/PackagePage.vue";
import ReportPage from "./pages/ReportPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage
    },
    {
      path: "/package/:pkgMatch(.*)*",
      name: "package",
      component: PackagePage
    },
    {
      path: "/report",
      name: "report",
      component: ReportPage
    },
    {
      path: "/methodology",
      name: "methodology",
      component: MethodologyPage
    }
  ]
});

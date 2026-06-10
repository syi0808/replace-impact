import { createRouter, createWebHistory } from "vue-router";
import HomePage from "./pages/HomePage.vue";
import PackagePage from "./pages/PackagePage.vue";
import ReportPage from "./pages/ReportPage.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/package/:pkgMatch(.*)*",
      name: "package",
      component: PackagePage,
    },
    {
      path: "/report",
      name: "report",
      component: ReportPage,
    },
  ],
});

import {createWebHistory, createRouter} from "vue-router";

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: "login",
        component: () => import("@/components/page/login/Login.vue")
    },
    {
        path: '/home',
        name: 'home',
        component: () => import("@/components/page/Home.vue"),
        redirect: '/index',
        children: [
            {
                path: "/index",
                name: "index",
                component: () => import("@/components/page/index/Index.vue"),
            },
            {
                path: "/enrolls",
                name: "enrolls",
                component: () => import("@/components/page/enrolls/Infos.vue"),
            },
            {
                path: "/info",
                name: "info",
                component: () => import("@/components/page/info/Index.vue"),
            },
        ]
    }
]
const router = createRouter({
    history: createWebHistory("/"),
    routes
})

router.beforeEach((to, from, next) => {
    if (to.path === "/login") {
        next();
    } else {
        let token = sessionStorage.getItem('Gmv-Token');
        if (token) {
            next();
        } else {
            next("/login");
        }
    }
})
export default router;

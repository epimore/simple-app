import http from "@/utils/http/http.js";

const login = (data) => {
    return http.post("/user/login", data);
};

export default {
    login
}
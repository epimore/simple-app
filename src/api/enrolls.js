import http from "@/utils/http/http.js";

const query = (data) => {
    return http.post("/enrolls/query", data);
};
const rm = (data) => {
    return http.post("/enrolls/rm", data);
};
const add = (data) => {
    return http.post("/enrolls/add", data);
};
const modify = (data) => {
    return http.post("/enrolls/modify", data);
};

export default {
    query,
    rm,
    add,
    modify
}
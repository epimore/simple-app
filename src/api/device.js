import http from "@/utils/http/http.js";

const deviceRm = (data) => {
    return http.post("/device/rm", data);
};
const channelRm = (data) => {
    return http.post("/channel/rm", data);
};

export default {
    deviceRm, channelRm
}
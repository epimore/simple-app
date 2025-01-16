import http from "@/utils/http/http.js";

const devicesInfo = (data) => {
    return http.post("/info/devices", data);
};
const channelInfo = (data) => {
    return http.post("/info/channels", data);
};

export default {
    devicesInfo,channelInfo
}
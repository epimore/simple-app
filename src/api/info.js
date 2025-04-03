import http from "@/utils/http/http.js";

const devicesInfo = (data) => {
    return http.post("/info/devices", data);
};
const channelInfo = (data) => {
    return http.post("/info/channels", data);
};

const request_image = (url) => {
    return http.request_image(url);
}

const channelImages = (data) => {
    return http.post("/info/channel/images", data);
}
export default {
    devicesInfo, channelInfo, request_image, channelImages
}
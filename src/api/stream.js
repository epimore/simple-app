import http from "@/utils/http/http.js";

const liveStream = (data) => {
    return http.post("/stream/play/live", data);
};
const backStream = (data) => {
    return http.post("/stream/play/back", data);
};
export default {
    liveStream,backStream
}

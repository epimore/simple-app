import http from "@/utils/http/http.js";

const liveStream = (data) => {
    return http.post("/stream/play/live", data);
};
const backStream = (data) => {
    return http.post("/stream/play/back", data);
};
const seekStream = (data) => {
    return http.post("/stream/play/back/seek", data);
};
const speedStream = (data) => {
    return http.post("/stream/play/back/speed", data);
};
export default {
    liveStream, backStream, seekStream, speedStream
}

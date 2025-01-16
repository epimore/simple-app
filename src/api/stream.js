import http from "@/utils/http/http.js";

const liveStream = (data) => {
    return http.post("/stream/play/live", data);
};
export default {
    liveStream
}

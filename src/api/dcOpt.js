import http from "@/utils/http/http.js";

const liveStream = (data) => {
    return http.post("/opt/play/live", data);
};
const backStream = (data) => {
    return http.post("/opt/play/back", data);
};
const seekStream = (data) => {
    return http.post("/opt/play/back/seek", data);
};
const speedStream = (data) => {
    return http.post("/opt/play/back/speed", data);
};
const controlPtz = (data) => {
    return http.post("/opt/control/ptz", data);
};
export default {
    liveStream, backStream, seekStream, speedStream, controlPtz
}

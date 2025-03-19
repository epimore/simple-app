import http from "@/utils/http/http.js";
import sse from "@/utils/http/sse.js";

const eventConn = (onMessage, onError) => {
    return sse('/sse/connect', onMessage, onError);
};
const eventClose = () => {
    return http.post("/sse/close", null);
};

export default {
    eventConn, eventClose
}

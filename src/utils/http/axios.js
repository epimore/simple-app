import axios from "axios";
import { ElMessage } from 'element-plus'
// 1. 创建axios实例
const instance = axios.create({
  // 接口
  baseURL: "/api",
  // 超时时间
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});
// 2.请求拦截
instance.interceptors.request.use(
  config => {
    let token = sessionStorage.getItem('Gmv-Token')
    if (token) {
      config.headers['Gmv-Token'] = token
    }
    return config;
  },
  error => {
    //  请求发生错误，抛出异常
    Promise.reject(error);
  }
);

// 3.响应拦截
instance.interceptors.response.use(
  res => {
    return res;
  },
  error => {
    if (error && error.response) {
      const status = error.response.status
      switch (status) {
        case 400:
          ElMessage.error("请求错误");
          break;
        case 401:
          ElMessage.error("未授权，请重新登录");
          break;
        case 403:
          ElMessage.error("拒绝访问");
          break;
        case 404:
          ElMessage.error("请求错误，未找到相应的资源");
          break;
        case 408:
          ElMessage.error("请求超时");
          break;
        case 500:
          ElMessage.error("服务器内部错误");
          break;
        case 501:
          ElMessage.error("网络未实现");
          break;
        case 502:
          ElMessage.error("网络错误");
          break;
        case 503:
          ElMessage.error("服务不可用");
          break;
        case 504:
          ElMessage.error("网络超时");
          break;
        case 505:
          ElMessage.error("HTTP版本不支持该请求");
          break;
        default:
          ElMessage.error("请求失败");
      }
    } else {
      if (JSON.stringify(error).includes("timeout")) {
        ElMessage.error("服务器响应超时，请刷新页面");
      }
      ElMessage.error("连接服务器失败");
    }
    return Promise.reject(error);
  }
);
// 4.导出 axios 实例
export default instance;


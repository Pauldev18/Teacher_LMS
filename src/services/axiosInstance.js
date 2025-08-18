import axios from 'axios';
import { toast } from "react-toastify";
const AxiosClient = axios.create({
  baseURL: 'http://localhost:8080',
});

AxiosClient.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let isUnauthorizedHandled = false; 

AxiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      (error?.response?.status === 401) &&
      !isUnauthorizedHandled
    ) {
      isUnauthorizedHandled = true; 

      sessionStorage.removeItem("token");
      toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    }

    return Promise.reject(error);
  }
);
export default AxiosClient;

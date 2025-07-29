import axios from 'axios';

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

export default AxiosClient;

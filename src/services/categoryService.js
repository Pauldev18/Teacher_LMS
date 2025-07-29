import axios from './axiosInstance';

export const fetchCategories = async () => {
  const res = await axios.get('/api/categories');
  return res.data.content;
};

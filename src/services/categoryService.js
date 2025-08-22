import AxiosClient from "./axiosInstance";

export const fetchCategories = async () => {
  const res = await AxiosClient.get('/api/categories');
  return res.data.content.filter(category => category.isActive === true);
};

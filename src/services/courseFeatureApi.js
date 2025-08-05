import AxiosClient from "./axiosInstance";



export async function fetchCourseFeatures(courseId) {
  const res = await AxiosClient.get(`/api/course-features/${courseId}`);
  return res.data;
}

export async function addCourseFeature(courseId, feature) {
  const res = await AxiosClient.post(`/api/course-features`, { courseId, feature });
  return res.data;
}

export async function removeCourseFeature(courseId, feature) {
  const res = await AxiosClient.delete(`/api/course-features/${courseId}/${encodeURIComponent(feature)}`);
  return res.data;
}

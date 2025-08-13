import AxiosClient from "./axiosInstance";


export const CAMPAIGN_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED'
};

export async function listSaleCampaigns({ page = 0, size = 20, sort = 'createdAt,DESC' } = {}) {
  const res = await AxiosClient.get('/api/sale-campaigns', { params: { page, size, sort } });
  return res.data;
}
export async function getSaleCampaign(id) {
  const res = await AxiosClient.get(`/api/sale-campaigns/${id}`);
  return res.data;
}
export async function createSaleCampaign(payload) {
  const res = await AxiosClient.post('/api/sale-campaigns', normalizeDateTimes(payload));
  return res.data;
}

export async function updateSaleCampaign(id, payload) {
  const res = await AxiosClient.put(`/api/sale-campaigns/${id}`, normalizeDateTimes(payload));
  return res.data;
}

export async function deleteSaleCampaign(id) {
  return AxiosClient.delete(`/api/sale-campaigns/${id}`);
}
export async function addCoursesToCampaignWithQuota(id, items) {
  const res = await AxiosClient.post(`/api/sale-campaigns/${id}/courses/quota`, { items }); // [{courseId, quantity}]
  return res.data;
}
export async function removeCoursesFromCampaign(id, courseIds) {
  const res = await AxiosClient.delete(`/api/sale-campaigns/${id}/courses`, { data: { courseIds } });
  return res.data;
}
export async function setCourseQuota(id, courseId, quantity) {
  const res = await AxiosClient.put(`/api/sale-campaigns/${id}/courses/${courseId}/quota`, null, {
    params: { quantity }
  });
  return res.data;
}

// Helpers
function normalizeDateTimes(dto) {
  const payload = { ...dto };
  if (payload.startDate && payload.startDate.length === 10) {
    payload.startDate = `${payload.startDate}T00:00:00`;
  }
  if (payload.endDate && payload.endDate.length === 10) {
    payload.endDate = `${payload.endDate}T23:59:59`;
  }
  return payload;
}

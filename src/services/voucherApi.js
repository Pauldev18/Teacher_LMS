import AxiosClient from "./axiosInstance"

export const VOUCHER_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED'
}

export const fetchVouchers = async () => {
  const res = await AxiosClient.get('/api/vouchers/instructor')
  return res.data 
}

// Hàm chuẩn hóa ngày cho đúng định dạng LocalDateTime
function normalizeVoucherDTO(dto) {
    return {
      ...dto,
      startDate: dto.startDate
        ? dto.startDate.includes('T')
          ? dto.startDate
          : dto.startDate + 'T00:00:00'
        : null,
      endDate: dto.endDate
        ? dto.endDate.includes('T')
          ? dto.endDate
          : dto.endDate + 'T23:59:59'
        : null,
    }
  }
  
  export const createVoucher = async (dto) => {
    const normalized = normalizeVoucherDTO(dto)
    const res = await AxiosClient.post('/api/vouchers', normalized)
    return res.data 
  }
  
  export const updateVoucher = async (id, dto) => {
    const normalized = normalizeVoucherDTO(dto)
    const res = await AxiosClient.put(`/api/vouchers/${id}`, normalized)
    return res.data 
  }
  

export const deleteVoucher = async (id) => {
  await AxiosClient.delete(`/api/vouchers/${id}`)
}

export const getVoucherById = async (id) => {
  const res = await AxiosClient.get(`/api/vouchers/${id}`)
  return res.data 
}

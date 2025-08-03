// Mock data for voucher management
// Based on VoucherResponseDTO structure

export const VOUCHER_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT'
  }
  
  export const VOUCHERS_DATA = [
    {
      id: 'voucher_1',
      code: 'WELCOME2024',
      discountAmount: 20.00,
      maxDiscountAmount: 100.00,
      type: VOUCHER_TYPES.PERCENTAGE,
      quantity: 100,
      used: 25,
      startDate: '2024-01-01T00:00:00',
      endDate: '2024-12-31T23:59:59',
      courseId: null, // Global voucher
      isActive: true,
      isGlobal: true,
      createdAt: '2023-12-15T10:30:00',
      createdById: 'admin_1',
      createdByName: 'Admin User'
    },
    {
      id: 'voucher_2',
      code: 'WEBDEV50',
      discountAmount: 50000,
      maxDiscountAmount: null,
      type: VOUCHER_TYPES.FIXED_AMOUNT,
      quantity: 50,
      used: 12,
      startDate: '2024-02-01T00:00:00',
      endDate: '2024-03-31T23:59:59',
      courseId: 'course_1',
      isActive: true,
      isGlobal: false,
      createdAt: '2024-01-20T14:15:00',
      createdById: 'lec_123456',
      createdByName: 'Dr. Sarah Johnson'
    },
    {
      id: 'voucher_3',
      code: 'STUDENT15',
      discountAmount: 15.00,
      maxDiscountAmount: 50.00,
      type: VOUCHER_TYPES.PERCENTAGE,
      quantity: 200,
      used: 89,
      startDate: '2024-01-15T00:00:00',
      endDate: '2024-06-30T23:59:59',
      courseId: null,
      isActive: true,
      isGlobal: true,
      createdAt: '2024-01-10T09:20:00',
      createdById: 'admin_1',
      createdByName: 'Admin User'
    },
    {
      id: 'voucher_4',
      code: 'JSADVANCED',
      discountAmount: 75000,
      maxDiscountAmount: null,
      type: VOUCHER_TYPES.FIXED_AMOUNT,
      quantity: 30,
      used: 30,
      startDate: '2024-01-01T00:00:00',
      endDate: '2024-01-31T23:59:59',
      courseId: 'course_2',
      isActive: false,
      isGlobal: false,
      createdAt: '2023-12-25T16:45:00',
      createdById: 'lec_123456',
      createdByName: 'Dr. Sarah Johnson'
    },
    {
      id: 'voucher_5',
      code: 'REACT2024',
      discountAmount: 25.00,
      maxDiscountAmount: 200.00,
      type: VOUCHER_TYPES.PERCENTAGE,
      quantity: 75,
      used: 5,
      startDate: '2024-03-01T00:00:00',
      endDate: '2024-05-31T23:59:59',
      courseId: 'course_3',
      isActive: true,
      isGlobal: false,
      createdAt: '2024-02-20T11:30:00',
      createdById: 'lec_123456',
      createdByName: 'Dr. Sarah Johnson'
    }
  ]
  
  // Mock service functions
  export const fetchVouchers = async (filters = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    let filteredVouchers = [...VOUCHERS_DATA]
    
    // Apply filters
    if (filters.status) {
      if (filters.status === 'active') {
        filteredVouchers = filteredVouchers.filter(v => v.isActive)
      } else if (filters.status === 'inactive') {
        filteredVouchers = filteredVouchers.filter(v => !v.isActive)
      } else if (filters.status === 'expired') {
        const now = new Date()
        filteredVouchers = filteredVouchers.filter(v => new Date(v.endDate) < now)
      }
    }
    
    if (filters.type) {
      filteredVouchers = filteredVouchers.filter(v => v.type === filters.type)
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredVouchers = filteredVouchers.filter(v => 
        v.code.toLowerCase().includes(searchLower) ||
        v.createdByName.toLowerCase().includes(searchLower)
      )
    }
    
    return filteredVouchers
  }
  
  export const createVoucher = async (voucherData) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newVoucher = {
      id: `voucher_${Date.now()}`,
      ...voucherData,
      used: 0,
      createdAt: new Date().toISOString(),
      createdById: 'lec_123456',
      createdByName: 'Dr. Sarah Johnson'
    }
    
    VOUCHERS_DATA.push(newVoucher)
    return newVoucher
  }
  
  export const updateVoucher = async (voucherId, voucherData) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const index = VOUCHERS_DATA.findIndex(v => v.id === voucherId)
    if (index === -1) {
      throw new Error('Voucher not found')
    }
    
    VOUCHERS_DATA[index] = {
      ...VOUCHERS_DATA[index],
      ...voucherData
    }
    
    return VOUCHERS_DATA[index]
  }
  
  export const deleteVoucher = async (voucherId) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const index = VOUCHERS_DATA.findIndex(v => v.id === voucherId)
    if (index === -1) {
      throw new Error('Voucher not found')
    }
    
    VOUCHERS_DATA.splice(index, 1)
    return { success: true }
  }
import { useState, useEffect } from 'react'
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit2, 
  FiTrash2, 
  FiCopy,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiUsers,
  FiGlobe,
  FiBook,
  FiToggleLeft,
  FiToggleRight,
  FiMoreVertical
} from 'react-icons/fi'
import { fetchVouchers, updateVoucher, deleteVoucher, VOUCHER_TYPES } from '../../data/voucherMockData'

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([])
  const [filteredVouchers, setFilteredVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  
  useEffect(() => {
    loadVouchers()
  }, [])
  
  useEffect(() => {
    filterVouchers()
  }, [vouchers, searchTerm, statusFilter, typeFilter])
  
  const loadVouchers = async () => {
    try {
      setLoading(true)
      const data = await fetchVouchers()
      setVouchers(data)
    } catch (error) {
      console.error('Error loading vouchers:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const filterVouchers = () => {
    let filtered = [...vouchers]
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(voucher => 
        voucher.code.toLowerCase().includes(searchLower) ||
        voucher.createdByName.toLowerCase().includes(searchLower)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date()
      if (statusFilter === 'active') {
        filtered = filtered.filter(v => v.isActive && new Date(v.endDate) > now)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(v => !v.isActive)
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(v => new Date(v.endDate) < now)
      }
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.type === typeFilter)
    }
    
    setFilteredVouchers(filtered)
  }
  
  const handleToggleActive = async (voucherId, currentStatus) => {
    try {
      const updatedVoucher = await updateVoucher(voucherId, { isActive: !currentStatus })
      setVouchers(vouchers.map(v => v.id === voucherId ? updatedVoucher : v))
    } catch (error) {
      console.error('Error updating voucher:', error)
    }
  }
  
  const handleDelete = async (voucherId) => {
    try {
      await deleteVoucher(voucherId)
      setVouchers(vouchers.filter(v => v.id !== voucherId))
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting voucher:', error)
    }
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }
  
  const getStatusBadge = (voucher) => {
    const now = new Date()
    const endDate = new Date(voucher.endDate)
    
    if (!voucher.isActive) {
      return <span className="badge bg-gray-100 text-gray-800">Inactive</span>
    } else if (endDate < now) {
      return <span className="badge bg-red-100 text-red-800">Expired</span>
    } else if (voucher.used >= voucher.quantity) {
      return <span className="badge bg-orange-100 text-orange-800">Used Up</span>
    } else {
      return <span className="badge bg-green-100 text-green-800">Active</span>
    }
  }
  
  const getUsagePercentage = (used, quantity) => {
    return Math.round((used / quantity) * 100)
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading vouchers...</div>
      </div>
    )
  }
  
  return (
    <div className="w-full mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Voucher Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage discount vouchers for your courses
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Create Voucher
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="form-input pl-10 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        <div className="relative sm:w-48">
          <select
            className="form-input appearance-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value={VOUCHER_TYPES.PERCENTAGE}>Percentage</option>
            <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Fixed Amount</option>
          </select>
        </div>
      </div>
      
      {/* Vouchers Table */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPercent className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No vouchers found</h3>
            <p className="text-gray-500">
              {vouchers.length === 0 
                ? 'Create your first voucher to get started.' 
                : 'No vouchers match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {voucher.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(voucher.code)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                            >
                              <FiCopy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">
                            by {voucher.createdByName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {voucher.type === VOUCHER_TYPES.PERCENTAGE ? (
                          <FiPercent className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <FiDollarSign className="h-4 w-4 text-blue-500 mr-1" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {voucher.type === VOUCHER_TYPES.PERCENTAGE 
                              ? `${voucher.discountAmount}%`
                              : formatCurrency(voucher.discountAmount)
                            }
                          </div>
                          {voucher.maxDiscountAmount && (
                            <div className="text-xs text-gray-500">
                              Max: {formatCurrency(voucher.maxDiscountAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-700">
                            {voucher.used}/{voucher.quantity}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({getUsagePercentage(voucher.used, voucher.quantity)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${getUsagePercentage(voucher.used, voucher.quantity)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-1 h-4 w-4" />
                        <div>
                          <div>{formatDate(voucher.startDate)}</div>
                          <div>to {formatDate(voucher.endDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {voucher.isGlobal ? (
                          <>
                            <FiGlobe className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-sm text-gray-700">Global</span>
                          </>
                        ) : (
                          <>
                            <FiBook className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-700">Course Specific</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(voucher)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(voucher.id, voucher.isActive)}
                          className={`${voucher.isActive ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {voucher.isActive ? <FiToggleRight className="h-5 w-5" /> : <FiToggleLeft className="h-5 w-5" />}
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === voucher.id ? null : voucher.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiMoreVertical className="h-5 w-5" />
                          </button>
                          
                          {openDropdown === voucher.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10">
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  // TODO: Implement edit functionality
                                  setOpenDropdown(null)
                                }}
                              >
                                <FiEdit2 className="mr-2 h-4 w-4" />
                                Edit
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  copyToClipboard(voucher.code)
                                  setOpenDropdown(null)
                                }}
                              >
                                <FiCopy className="mr-2 h-4 w-4" />
                                Copy Code
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                onClick={() => {
                                  setShowDeleteConfirm(voucher.id)
                                  setOpenDropdown(null)
                                }}
                              >
                                <FiTrash2 className="mr-2 h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Voucher</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this voucher? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoucherManagement
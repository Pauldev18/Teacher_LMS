import { useState, useEffect } from "react";
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCopy,
  FiCalendar, FiPercent, FiDollarSign, FiBook,
  FiToggleLeft, FiToggleRight, FiMoreVertical,
  FiGlobe,
} from "react-icons/fi";
import {
  fetchVouchers, updateVoucher, deleteVoucher, createVoucher, VOUCHER_TYPES,
} from "../../services/voucherApi";
import { toast } from "react-toastify";
import CourseSelectPopup from "../../components/CourseSelectPopup";
import Modal from "./Modal";
import { fetchCourses, fetchCoursesyInstructor } from "../../services/courseService";

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [courses, setCourses] = useState([]);
  // Popup chọn khoá học
  const [showCoursePopup, setShowCoursePopup] = useState(false);
  const [pendingCourseIds, setPendingCourseIds] = useState([]);
  // Form tạo mới
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discountAmount: "",
    maxDiscountAmount: "",
    type: VOUCHER_TYPES.PERCENTAGE,
    quantity: 100,
    startDate: "",
    endDate: "",
    courseIds: [],
  });

  const courseMap = {};
  courses.forEach((c) => {
    courseMap[c.id] = c;
  });

  // Form update
  const [editVoucher, setEditVoucher] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => { loadVouchers(); }, []);
  useEffect(() => {
    const fetchChooseCourses = async () => {
      try {
        setCourses(await fetchCoursesyInstructor());
      } catch {
        setCourses([]);
      }
    };
    fetchChooseCourses();
  }, []);

  useEffect(() => { filterVouchers(); }, [vouchers, searchTerm, statusFilter, typeFilter]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setVouchers(await fetchVouchers());
    } catch (error) {
      console.error("Lỗi load voucher:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterVouchers = () => {
    let filtered = [...vouchers];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (voucher) =>
          voucher.code.toLowerCase().includes(searchLower) ||
          (voucher.createdByName || "").toLowerCase().includes(searchLower)
      );
    }
    if (statusFilter !== "all") {
      const now = new Date();
      if (statusFilter === "active") {
        filtered = filtered.filter((v) => v.isActive && new Date(v.endDate) > now);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((v) => !v.isActive);
      } else if (statusFilter === "expired") {
        filtered = filtered.filter((v) => new Date(v.endDate) < now);
      }
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }
    setFilteredVouchers(filtered);
  };

  const handleToggleActive = async (voucherId, currentStatus) => {
    try {
      const voucher = vouchers.find((v) => v.id === voucherId);
      if (!voucher) return;
      const dto = { ...voucher, isActive: !currentStatus };
      delete dto.id;
      const updated = await updateVoucher(voucherId, dto);
      setVouchers(vouchers.map((v) => (v.id === voucherId ? updated : v)));
      toast.success("Update trạng thái thành công");
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      toast.error("Update trạng thái thất bại");
    }
  };

  const handleDelete = async (voucherId) => {
    try {
      await deleteVoucher(voucherId);
      setVouchers(vouchers.filter((v) => v.id !== voucherId));
      setShowDeleteConfirm(null);
      toast.success("Xóa voucher thành công.");
    } catch (error) {
      console.error("Lỗi xoá voucher:", error);
      toast.error("Xóa voucher thất bại.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copy mã voucher thành công");
  };

  const formatCurrency = (amount) => {
    if (amount == null) return "";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (voucher) => {
    const now = new Date();
    const endDate = new Date(voucher.endDate);
    if (!voucher.isActive) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Ngưng</span>;
    } else if (endDate < now) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Hết hạn</span>;
    } else if (voucher.used >= voucher.quantity) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Hết lượt</span>;
    } else {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đang hoạt động</span>;
    }
  };

  const getUsagePercentage = (used, quantity) => {
    if (!quantity) return 0;
    return Math.round((used / quantity) * 100);
  };

  // Tạo voucher mới
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (newVoucher.courseIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khoá học");
      return;
    }
    try {
      // Nhiều khoá học: gọi nhiều request
      const createdList = [];
      for (let courseId of newVoucher.courseIds) {
        const dto = {
          ...newVoucher,
          courseId,
          isGlobal: false,
        };
        delete dto.courseIds; // Remove courseIds from the request
        const created = await createVoucher(dto);
        createdList.push(created);
      }
      setVouchers([...createdList, ...vouchers]);
      setShowCreateModal(false);
      setNewVoucher({
        code: "",
        discountAmount: "",
        maxDiscountAmount: "",
        type: VOUCHER_TYPES.PERCENTAGE,
        quantity: 100,
        startDate: "",
        endDate: "",
        courseIds: [],
      });
      toast.success("Tạo mới voucher thành công");
    } catch (err) {
      toast.error("Lỗi tạo voucher: " + (err?.message || ""));
    }
  };

  // Mở modal update voucher
  const openEditModal = (voucher) => {
    setEditVoucher({
      ...voucher,
      discountAmount: voucher.discountAmount || "",
      maxDiscountAmount: voucher.maxDiscountAmount || "",
      quantity: voucher.quantity || 1,
      startDate: voucher.startDate ? voucher.startDate.split("T")[0] : "",
      endDate: voucher.endDate ? voucher.endDate.split("T")[0] : "",
      courseIds: voucher.courseId ? [voucher.courseId] : [],
    });
    setShowEditModal(true);
  };

  // Chọn khoá học (tạo mới)
  const handleOpenCoursePopup = () => {
    setPendingCourseIds(newVoucher.courseIds);
    setShowCoursePopup(true);
  };
  const handleSaveCourses = (ids) => {
    setNewVoucher({ ...newVoucher, courseIds: ids });
  };

  // Chọn khoá học (update)
  const handleOpenCoursePopupEdit = () => {
    setPendingCourseIds(editVoucher.courseIds);
    setShowCoursePopup(true);
  };
  const handleSaveCoursesEdit = (ids) => {
    setEditVoucher({ ...editVoucher, courseIds: ids });
  };

  // Update voucher
  const handleUpdateVoucher = async (e) => {
    e.preventDefault();
    if (editVoucher.courseIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khoá học");
      return;
    }
    try {
      let updatedList = [];
      for (let courseId of editVoucher.courseIds) {
        const dto = {
          ...editVoucher,
          courseId,
          isGlobal: false,
        };
        delete dto.courseIds; // Remove courseIds from the request
        const updated = await updateVoucher(editVoucher.id, dto);
        updatedList.push(updated);
      }
      setVouchers(
        vouchers.map((v) =>
          updatedList.find((u) => u.id === v.id) || v
        )
      );
      setShowEditModal(false);
      setEditVoucher(null);
      toast.success("Cập nhật voucher thành công");
    } catch (err) {
      toast.error("Lỗi cập nhật voucher: " + (err?.message || ""));
    }
  };

  const [showMaxDiscount, setShowMaxDiscount] = useState(true);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-blue-500">Đang tải voucher...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Voucher Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo và quản lý mã giảm giá cho khoá học của bạn
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              placeholder="Tìm kiếm voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            <option value={VOUCHER_TYPES.PERCENTAGE}>Phần trăm</option>
            <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Giá trị cố định</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngưng hoạt động</option>
            <option value="expired">Hết hạn</option>
          </select>
        </div>
        <div className="flex-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <FiPlus className="mr-2" />
            Tạo voucher
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPercent className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Không có voucher</h3>
            <p className="text-gray-500">
              {vouchers.length === 0
                ? "Tạo voucher đầu tiên để bắt đầu."
                : "Không có voucher nào phù hợp."}
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
                  <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                              {voucher.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(voucher.code)}
                              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <FiCopy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            by {voucher.createdByName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {voucher.type === VOUCHER_TYPES.PERCENTAGE ? (
                          <FiPercent className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <FiDollarSign className="h-4 w-4 text-blue-500 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {voucher.type === VOUCHER_TYPES.PERCENTAGE
                              ? `${voucher.discountAmount}%`
                              : formatCurrency(voucher.discountAmount)}
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
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${getUsagePercentage(
                                voucher.used,
                                voucher.quantity
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-2 h-4 w-4" />
                        <div>
                          <div>{formatDate(voucher.startDate)}</div>
                          <div className="text-xs">to {formatDate(voucher.endDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {voucher.isGlobal || !voucher.courseId ? (
                        <div className="flex items-center">
                        <FiGlobe className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-sm text-gray-700">Toàn hệ thống</span>
                        </div>
                      ) : (
                        (() => {
                          const course = courseMap[voucher.courseId];
                          return course ? (
                            <div className="flex items-center">
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-9 h-9 object-cover rounded mr-2 border border-gray-200 bg-gray-50"
                                style={{ minWidth: 36, minHeight: 36 }}
                              />
                              <span
                                className="text-sm font-medium text-gray-700 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                                title={course.title}
                              >
                                {course.title}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">[Khoá học đã xóa]</span>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(voucher)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(voucher.id, voucher.isActive)}
                          className={`transition-colors ${voucher.isActive
                            ? "text-green-600 hover:text-green-800"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                          title={voucher.isActive ? "Ngưng hoạt động" : "Kích hoạt"}
                        >
                          {voucher.isActive ? (
                            <FiToggleRight className="h-5 w-5" />
                          ) : (
                            <FiToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === voucher.id ? null : voucher.id)
                            }
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FiMoreVertical className="h-5 w-5" />
                          </button>
                          {openDropdown === voucher.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10 border">
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  openEditModal(voucher);
                                  setOpenDropdown(null);
                                }}
                              >
                                <FiEdit2 className="mr-2 h-4 w-4" />
                                Sửa
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  copyToClipboard(voucher.code);
                                  setOpenDropdown(null);
                                }}
                              >
                                <FiCopy className="mr-2 h-4 w-4" />
                                Copy code
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  setShowDeleteConfirm(voucher.id);
                                  setOpenDropdown(null);
                                }}
                              >
                                <FiTrash2 className="mr-2 h-4 w-4" />
                                Xoá
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

      {/* Modal tạo voucher */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tạo voucher mới"
          size="lg"
        >
          <form onSubmit={handleCreateVoucher} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã voucher</label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newVoucher.code}
                onChange={e => setNewVoucher({ ...newVoucher, code: e.target.value })}
                placeholder="Mã voucher tự sinh"
                disabled={true}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu giảm giá</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newVoucher.type}
                  onChange={e => {
                    const value = e.target.value;
                    setNewVoucher({
                      ...newVoucher,
                      type: value,
                      maxDiscountAmount: value === VOUCHER_TYPES.PERCENTAGE ? newVoucher.maxDiscountAmount : ''
                    });
                    setShowMaxDiscount(value === VOUCHER_TYPES.PERCENTAGE);
                  }}
                >
                  <option value={VOUCHER_TYPES.PERCENTAGE}>Phần trăm</option>
                  <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Giá trị cố định</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị giảm</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  value={newVoucher.discountAmount}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, discountAmount: e.target.value })
                  }
                  min={1}
                  required
                />
              </div>
            </div>

            {showMaxDiscount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giảm tối đa</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  value={newVoucher.maxDiscountAmount}
                  onChange={e => setNewVoucher({ ...newVoucher, maxDiscountAmount: e.target.value })}
                  min={0}
                  placeholder="Chỉ áp dụng với loại %"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  value={newVoucher.quantity}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, quantity: e.target.value })
                  }
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khoá học</label>
                <button
                  type="button"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left transition-colors"
                  onClick={handleOpenCoursePopup}
                >
                  {newVoucher.courseIds.length === 0
                    ? "Chọn khoá học"
                    : `${newVoucher.courseIds.length} khoá học đã chọn`}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="date"
                  value={newVoucher.startDate}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="date"
                  value={newVoucher.endDate}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Huỷ
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tạo mới
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal chỉnh sửa voucher */}
      {showEditModal && editVoucher && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditVoucher(null);
          }}
          title="Chỉnh sửa voucher"
          size="lg"
        >
          <form onSubmit={handleUpdateVoucher} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mã voucher</label>
              <input 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" 
                value={editVoucher.code} 
                disabled 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu giảm giá</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={editVoucher.type}
                  onChange={e => {
                    const value = e.target.value;
                    setEditVoucher({
                      ...editVoucher,
                      type: value,
                      maxDiscountAmount: value === VOUCHER_TYPES.PERCENTAGE ? editVoucher.maxDiscountAmount : ''
                    });
                    setShowMaxDiscount(value === VOUCHER_TYPES.PERCENTAGE);
                  }}
                >
                  <option value={VOUCHER_TYPES.PERCENTAGE}>Phần trăm</option>
                  <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Giá trị cố định</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị giảm</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  value={editVoucher.discountAmount}
                  onChange={(e) =>
                    setEditVoucher({
                      ...editVoucher,
                      discountAmount: e.target.value,
                    })
                  }
                  min={1}
                  required
                />
              </div>
            </div>

            {showMaxDiscount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giảm tối đa</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  value={editVoucher.maxDiscountAmount}
                  onChange={e => setEditVoucher({ ...editVoucher, maxDiscountAmount: e.target.value })}
                  min={0}
                  placeholder="Chỉ áp dụng với loại %"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  value={editVoucher.quantity}
                  onChange={(e) =>
                    setEditVoucher({ ...editVoucher, quantity: e.target.value })
                  }
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khoá học</label>
                <button
                  type="button"
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-400 text-left transition-colors cursor-not-allowed"
                  onClick={handleOpenCoursePopupEdit}
                  disabled={true}
                >
                  {editVoucher.courseIds.length === 0
                    ? "Chọn khoá học"
                    : `${editVoucher.courseIds.length} khoá học đã chọn`}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="date"
                  value={editVoucher.startDate}
                  onChange={(e) =>
                    setEditVoucher({ ...editVoucher, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="date"
                  value={editVoucher.endDate}
                  onChange={(e) =>
                    setEditVoucher({ ...editVoucher, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowEditModal(false);
                  setEditVoucher(null);
                }}
              >
                Huỷ
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Popup chọn khoá học cho cả create & update */}
      {showCoursePopup && (
        <CourseSelectPopup
          courses={courses}
          selectedIds={pendingCourseIds}
          onSave={showEditModal ? handleSaveCoursesEdit : handleSaveCourses}
          onClose={() => setShowCoursePopup(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Xoá voucher</h2>
            <p className="text-gray-700 mb-6">
              Bạn chắc chắn muốn xoá voucher này? Thao tác không thể hoàn tác!
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;

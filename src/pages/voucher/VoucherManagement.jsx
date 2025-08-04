import { useState, useEffect } from "react";
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCopy,
  FiCalendar, FiPercent, FiDollarSign, FiGlobe, FiBook,
  FiToggleLeft, FiToggleRight, FiMoreVertical,
} from "react-icons/fi";
import {
  fetchVouchers, updateVoucher, deleteVoucher, createVoucher, VOUCHER_TYPES,
} from "../../services/voucherApi";
import { toast } from "react-toastify";
import CourseSelectPopup from "../../components/CourseSelectPopup";
import Modal from "./Modal";
import { fetchCourses } from "../../services/courseService";

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
    isGlobal: true,
    courseIds: [],
  });
  // Form update
  const [editVoucher, setEditVoucher] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => { loadVouchers(); }, []);
  useEffect(() => {
    const fetchChooseCourses = async () => {
      try {
        setCourses(await fetchCourses());
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
      return <span className="badge bg-gray-100 text-gray-800">Ngưng</span>;
    } else if (endDate < now) {
      return <span className="badge bg-red-100 text-red-800">Hết hạn</span>;
    } else if (voucher.used >= voucher.quantity) {
      return <span className="badge bg-orange-100 text-orange-800">Hết lượt</span>;
    } else {
      return <span className="badge bg-green-100 text-green-800">Đang hoạt động</span>;
    }
  };

  const getUsagePercentage = (used, quantity) => {
    if (!quantity) return 0;
    return Math.round((used / quantity) * 100);
  };

  // Tạo voucher mới
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      if (newVoucher.isGlobal) {
        // Toàn hệ thống: 1 request duy nhất
        const dto = {
          ...newVoucher,
          courseId: null,
          courseIds: undefined,
        };
        const created = await createVoucher(dto);
        setVouchers([created, ...vouchers]);
      } else {
        // Nhiều khoá học: gọi nhiều request
        const createdList = [];
        for (let courseId of newVoucher.courseIds) {
          const dto = {
            ...newVoucher,
            courseId,
            courseIds: undefined,
          };
          const created = await createVoucher(dto);
          createdList.push(created);
        }
        setVouchers([...createdList, ...vouchers]);
      }
      setShowCreateModal(false);
      setNewVoucher({
        code: "",
        discountAmount: "",
        maxDiscountAmount: "",
        type: VOUCHER_TYPES.PERCENTAGE,
        quantity: 100,
        startDate: "",
        endDate: "",
        isGlobal: true,
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
      isGlobal: voucher.isGlobal === true,
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
    try {
      if (editVoucher.isGlobal) {
        const dto = {
          ...editVoucher,
          courseId: null,
          courseIds: undefined,
        };
        const updated = await updateVoucher(editVoucher.id, dto);
        setVouchers(vouchers.map((v) => (v.id === updated.id ? updated : v)));
      } else {
        let updatedList = [];
        for (let courseId of editVoucher.courseIds) {
          const dto = {
            ...editVoucher,
            courseId,
            courseIds: undefined,
          };
          const updated = await updateVoucher(editVoucher.id, dto);
          updatedList.push(updated);
        }
        setVouchers(
          vouchers.map((v) =>
            updatedList.find((u) => u.id === v.id) || v
          )
        );
      }
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
        <div className="animate-pulse text-primary-500">Đang tải voucher...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
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
          <input
            type="text"
            className="input w-full max-w-xs"
            placeholder="Tìm kiếm voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input max-w-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tất cả loại</option>
            <option value={VOUCHER_TYPES.PERCENTAGE}>Phần trăm</option>
            <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Giá trị cố định</option>
          </select>
          <select
            className="input max-w-xs"
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
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Tạo voucher
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
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
                            className="bg-primary-500 h-2 rounded-full"
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
                            <span className="text-sm text-gray-700">Toàn hệ thống</span>
                          </>
                        ) : (
                          <>
                            <FiBook className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-700">Khoá học</span>
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
                          className={`${voucher.isActive
                            ? "text-green-600 hover:text-green-900"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
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
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiMoreVertical className="h-5 w-5" />
                          </button>
                          {openDropdown === voucher.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10">
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  openEditModal(voucher);
                                  setOpenDropdown(null);
                                }}
                              >
                                <FiEdit2 className="mr-2 h-4 w-4" />
                                Sửa
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  copyToClipboard(voucher.code);
                                  setOpenDropdown(null);
                                }}
                              >
                                <FiCopy className="mr-2 h-4 w-4" />
                                Copy code
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
          size="md"
        >
          <form onSubmit={handleCreateVoucher} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Mã voucher</label>
              <input
                  className="input w-full"
                  value={newVoucher.code}
                  onChange={e => setNewVoucher({ ...newVoucher, code: e.target.value })}
                  required={newVoucher.isGlobal}
                  disabled={!newVoucher.isGlobal}
                  placeholder={
                    newVoucher.isGlobal
                      ? "Nhập mã hoặc để trống để tự sinh"
                      : "Không nhập mã khi chọn khoá học"
                  }
                />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Kiểu giảm giá</label>
                <select
                  className="input w-full"
                  value={newVoucher.type}
                  onChange={e => {
                    const value = e.target.value;
                    setNewVoucher({
                      ...newVoucher,
                      type: value,
                      // Nếu là giảm cố định thì reset luôn trường maxDiscountAmount
                      maxDiscountAmount: value === VOUCHER_TYPES.PERCENTAGE ? newVoucher.maxDiscountAmount : ''
                    });
                    setShowMaxDiscount(value === VOUCHER_TYPES.PERCENTAGE);
                  }}
                
                >
                  <option value={VOUCHER_TYPES.PERCENTAGE}>Phần trăm</option>
                  <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Giá trị cố định</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Giá trị giảm</label>
                <input
                  className="input w-full"
                  type="number"
                  value={newVoucher.discountAmount}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, discountAmount: e.target.value })
                  }
                  min={1}
                  required
                />
              </div>
           
              {showMaxDiscount && (
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Giảm tối đa</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={newVoucher.maxDiscountAmount}
                    onChange={e => setNewVoucher({ ...newVoucher, maxDiscountAmount: e.target.value })}
                    min={0}
                    placeholder="Chỉ áp dụng với loại %"
                  />
                </div>
              )}

           

            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Số lượng</label>
                <input
                  className="input w-full"
                  type="number"
                  value={newVoucher.quantity}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, quantity: e.target.value })
                  }
                  min={1}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Phạm vi áp dụng
                </label>
                <select
                  className="input w-full"
                  value={newVoucher.isGlobal ? "true" : "false"}
                  onChange={(e) => {
                    const isGlobal = e.target.value === "true";
                    setNewVoucher({
                      ...newVoucher,
                      isGlobal,
                      courseIds: isGlobal ? [] : newVoucher.courseIds,
                    });
                  }}
                >
                  <option value="true">Toàn hệ thống</option>
                  <option value="false">Chọn khoá học</option>
                </select>
              </div>
              {!newVoucher.isGlobal && (
                <div className="flex-1 flex flex-col justify-end">
                  <label className="block mb-1 font-medium text-transparent">_</label>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleOpenCoursePopup}
                  >
                    {newVoucher.courseIds.length === 0
                      ? "Chọn khoá học"
                      : `${newVoucher.courseIds.length} khoá học đã chọn`}
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Ngày bắt đầu</label>
                <input
                  className="input w-full"
                  type="date"
                  value={newVoucher.startDate}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Ngày kết thúc</label>
                <input
                  className="input w-full"
                  type="date"
                  value={newVoucher.endDate}
                  onChange={(e) =>
                    setNewVoucher({ ...newVoucher, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
              >
                Huỷ
              </button>
              <button type="submit" className="btn btn-primary">
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
          size="md"
        >
          <form onSubmit={handleUpdateVoucher} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Mã voucher</label>
              <input className="input w-full" value={editVoucher.code} disabled />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Kiểu giảm giá</label>
                <select
                  className="input w-full"
                  value={editVoucher.type}
                  onChange={e => {
                    const value = e.target.value;
                    setEditVoucher({
                      ...editVoucher,
                      type: value,
                      // Nếu là giảm cố định thì reset luôn trường maxDiscountAmount
                      maxDiscountAmount: value === VOUCHER_TYPES.PERCENTAGE ? editVoucher.maxDiscountAmount : ''
                    });
                    setShowMaxDiscount(value === VOUCHER_TYPES.PERCENTAGE);
                  }}
                >
                  <option value={VOUCHER_TYPES.PERCENTAGE}>Phần trăm</option>
                  <option value={VOUCHER_TYPES.FIXED_AMOUNT}>Giá trị cố định</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Giá trị giảm</label>
                <input
                  className="input w-full"
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
              {showMaxDiscount && (
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Giảm tối đa</label>
                  <input
                    className="input w-full"
                    type="number"
                    value={editVoucher.maxDiscountAmount}
                    onChange={e => setEditVoucher({ ...editVoucher, maxDiscountAmount: e.target.value })}
                    min={0}
                    placeholder="Chỉ áp dụng với loại %"
                  />
                </div>
                )}
            
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Số lượng</label>
                <input
                  className="input w-full"
                  type="number"
                  value={editVoucher.quantity}
                  onChange={(e) =>
                    setEditVoucher({ ...editVoucher, quantity: e.target.value })
                  }
                  min={1}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">
                  Phạm vi áp dụng
                </label>
                <select
                  className="input w-full"
                  value={editVoucher.isGlobal ? "true" : "false"}
                  onChange={(e) => {
                    const isGlobal = e.target.value === "true";
                    setEditVoucher({
                      ...editVoucher,
                      isGlobal,
                      courseIds: isGlobal ? [] : editVoucher.courseIds,
                    });
                  }}
                >
                  <option value="true">Toàn hệ thống</option>
                  <option value="false">Chọn khoá học</option>
                </select>
              </div>
              {!editVoucher.isGlobal && (
                <div className="flex-1 flex flex-col justify-end">
                  <label className="block mb-1 font-medium text-transparent">_</label>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleOpenCoursePopupEdit}
                  >
                    {editVoucher.courseIds.length === 0
                      ? "Chọn khoá học"
                      : `${editVoucher.courseIds.length} khoá học đã chọn`}
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block mb-1 font-medium">Ngày bắt đầu</label>
                <input
                  className="input w-full"
                  type="date"
                  value={editVoucher.startDate}
                  onChange={(e) =>
                    setEditVoucher({ ...editVoucher, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Ngày kết thúc</label>
                <input
                  className="input w-full"
                  type="date"
                  value={editVoucher.endDate}
                  onChange={(e) =>
                    setEditVoucher({ ...editVoucher, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditVoucher(null);
                }}
              >
                Huỷ
              </button>
              <button type="submit" className="btn btn-primary">
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
            <h2 className="text-xl font-bold mb-4">Xoá voucher</h2>
            <p className="text-gray-700 mb-6">
              Bạn chắc chắn muốn xoá voucher này? Thao tác không thể hoàn tác!
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-outline"
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="btn btn-danger"
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

import { useEffect, useMemo, useState } from "react";
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCalendar, FiMoreVertical,
  FiToggleLeft, FiToggleRight, FiPercent, FiDollarSign, FiBookOpen, FiX, FiLayers
} from "react-icons/fi";
import { toast } from "react-toastify";


import {
  listSaleCampaigns,
  createSaleCampaign,
  updateSaleCampaign,
  deleteSaleCampaign,
  setCourseQuota,
  removeCoursesFromCampaign,
  CAMPAIGN_TYPES,
  addCoursesToCampaignWithQuota
} from "../../services/saleCampaignApi";
import { fetchCoursesyInstructor } from "../../services/courseService";
import Modal from "./Modal";
import CourseSelectPopup from "../../components/CourseSelectPopup";
import CourseSelectPopupWithQuantity from "./CourseSelectPopupWithQuantity";

const initialCreate = {
  id: "",                 // có thể để rỗng, nếu BE cho auto-id thì bỏ field này
  name: "",
  description: "",
  startDate: "",          // yyyy-MM-dd
  endDate: "",            // yyyy-MM-dd
  discountAmount: "",
  maxDiscountAmount: "",  // áp dụng cho % (trần)
  type: CAMPAIGN_TYPES.PERCENTAGE,
  isActive: true,
  courseIds: [],
};

export default function SaleCampaignManagement() {
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // active | inactive | upcoming | expired

  const [openDropdown, setOpenDropdown] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [createForm, setCreateForm] = useState(initialCreate);
  const [editForm, setEditForm] = useState(null); // CampaignDTO

  const [courses, setCourses] = useState([]);
  const [showCoursePopup, setShowCoursePopup] = useState(false);
  const [popupFor, setPopupFor] = useState("create"); // "create" | "edit"
  const [pendingCourseIds, setPendingCourseIds] = useState([]);
// state mới
const [popupCampaign, setPopupCampaign] = useState(null); // { id, courseIds }
const [selectedItems, setSelectedItems] = useState([]); // [{courseId, quantity}]


// helper áp dụng diff add/remove
async function applyCourseDiff(campaignId, prevIds = [], nextIds = []) {
  const prev = new Set(prevIds);
  const next = new Set(nextIds);

  const toAdd = [...next].filter(x => !prev.has(x));
  const toRemove = [...prev].filter(x => !next.has(x));

  if (!toAdd.length && !toRemove.length) return;

  try {
    if (toAdd.length) await addCoursesToCampaign(campaignId, toAdd);
    if (toRemove.length) await removeCoursesFromCampaign(campaignId, toRemove);

    // cập nhật lại row trong danh sách
    setPageData(prevPage => ({
      ...prevPage,
      content: prevPage.content.map(row =>
        row.id === campaignId ? { ...row, courseIds: nextIds } : row
      ),
    }));
    toast.success("Cập nhật khoá học cho campaign thành công");
  } catch (e) {
    console.error(e);
    toast.error("Cập nhật khoá học thất bại");
  }
}
function openCoursePopupForRow(c) {
  setPopupFor("list");
  setSelectedItems(
    Array.isArray(c.items)
      ? c.items.map(it => ({ courseId: it.courseId, quantity: it.quantity ?? null }))
      : (c.courseIds || []).map(id => ({ courseId: id, quantity: null }))
  );
  setPopupCampaign({ id: c.id, courseIds: c.courseIds || [] });
  setShowCoursePopup(true);
}

  
  // Load campaigns
  useEffect(() => { loadCampaigns(); }, []);
  const loadCampaigns = async ({ page = 0, size = 20, sort = "createdAt,DESC" } = {}) => {
    try {
      setLoading(true);
      const data = await listSaleCampaigns({ page, size, sort });
      setPageData(data);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được danh sách sale campaign");
    } finally {
      setLoading(false);
    }
  };

  // Load courses để chọn
  useEffect(() => {
    (async () => {
      try {
        setCourses(await fetchCoursesyInstructor());
      } catch {
        setCourses([]);
      }
    })();
  }, []);

  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach(c => { map[c.id] = c; });
    return map;
  }, [courses]);

  // Filter client-side
  const filtered = useMemo(() => {
    const now = new Date();
    let items = [...(pageData.content || [])];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(x =>
        (x.name || "").toLowerCase().includes(q) ||
        (x.description || "").toLowerCase().includes(q) ||
        (x.id || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      items = items.filter(x => x.type === typeFilter);
    }
    if (statusFilter !== "all") {
      items = items.filter(x => getCampaignStatus(x, now) === statusFilter);
    }
    return items;
  }, [pageData.content, searchTerm, typeFilter, statusFilter]);

  const openCreateModal = () => {
    setCreateForm(initialCreate);
    setShowCreate(true);
  };

  const onSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      // validate tối thiểu
      if (!createForm.name) return toast.error("Vui lòng nhập tên");
      if (!createForm.startDate || !createForm.endDate) return toast.error("Chọn thời gian");
  
      const payload = {
        ...createForm,
        discountAmount: +createForm.discountAmount || 0,
        maxDiscountAmount: createForm.type === CAMPAIGN_TYPES.PERCENTAGE ? (+createForm.maxDiscountAmount || 0) : 0,
        items: (createForm.items || []).map(it => ({ courseId: it.courseId, quantity: it.quantity ?? null }))
      };
      const created = await createSaleCampaign(payload);
      toast.success("Tạo sale campaign thành công");
      setShowCreate(false);
      loadCampaigns();
    } catch (e2) {
      console.error(e2);
      toast.error(e2?.response?.data?.message || "Tạo sale campaign thất bại");
    }
  };
  

  const openEditModal = async (row) => {
    // Lấy detail để có courseIds đầy đủ
    try {
      const detail = await getSaleDetail(row.id);
      setEditForm(detailToEditForm(detail));
      setShowEdit(true);
    } catch (e) {
      console.error(e);
      toast.error("Không lấy được thông tin campaign");
    }
  };

  const getSaleDetail = async (id) => {
    // tái sử dụng getSaleCampaign để lấy courseIds
    const { getSaleCampaign } = await import("../../services/saleCampaignApi");
    return await getSaleCampaign(id);
  };

  const detailToEditForm = (c) => {
    const items = Array.isArray(c.items)
      ? c.items.map(it => ({ courseId: it.courseId, quantity: it.quantity ?? null }))
      : Array.isArray(c.courseIds)
        ? c.courseIds.map(id => ({ courseId: id, quantity: null }))
        : [];
  
    return {
      id: c.id,
      name: c.name,
      description: c.description || "",
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      endDate: c.endDate ? c.endDate.slice(0, 10) : "",
      discountAmount: c.discountAmount ?? "",
      maxDiscountAmount: c.maxDiscountAmount ?? "",
      type: c.type,
      isActive: c.isActive,
      // giữ cả items + sync courseIds từ items
      items,
      courseIds: items.map(x => x.courseId),
      createdAt: c.createdAt,
      createdById: c.createdById
    };
  };
  

  const onSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const id = editForm.id;
      const payload = {
        name: editForm.name,
        description: editForm.description,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        discountAmount: +editForm.discountAmount || 0,
        maxDiscountAmount: editForm.type === CAMPAIGN_TYPES.PERCENTAGE ? (+editForm.maxDiscountAmount || 0) : 0,
        type: editForm.type,
        isActive: editForm.isActive,
      };
      const updated = await updateSaleCampaign(id, payload);
      toast.success("Cập nhật sale campaign thành công");
      setShowEdit(false);
      setEditForm(null);
      // refresh
      loadCampaigns();
    } catch (e2) {
      console.error(e2);
      toast.error(e2?.response?.data?.message || "Cập nhật campaign thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xoá campaign này? Hành động không thể hoàn tác!")) return;
    try {
      await deleteSaleCampaign(id);
      toast.success("Đã xoá campaign");
      loadCampaigns();
    } catch (e) {
      console.error(e);
      toast.error("Xoá campaign thất bại");
    }
  };

  const handleToggleActive = async (row) => {
    try {
      const updated = await updateSaleCampaign(row.id, { isActive: !row.isActive });
      toast.success("Đã cập nhật trạng thái");
      // cập nhật vào danh sách hiện tại
      setPageData(prev => ({
        ...prev,
        content: prev.content.map(x => x.id === row.id ? { ...x, isActive: updated.isActive } : x)
      }));
    } catch (e) {
      console.error(e);
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  // chọn khoá học (tạo)
  const openCoursePopupCreate = () => {
    setPopupFor("create");
    // map từ createForm.courseIds cũ -> items
    const items = (createForm.items || (createForm.courseIds || []).map(id => ({ courseId: id, quantity: null })));
    setSelectedItems(items);
    setShowCoursePopup(true);
  };
  const saveCoursesCreate = (items) => {
    setCreateForm({ ...createForm, items, courseIds: items.map(x => x.courseId) });
  };
  

  const openCoursePopupEdit = () => {
    setPopupFor("edit");
    const items = (editForm.items && editForm.items.length)
      ? editForm.items
      : (editForm.courseIds || []).map(id => ({ courseId: id, quantity: null }));
    setSelectedItems(items);
    setShowCoursePopup(true);
  };
  
  const saveCoursesEdit = async (items) => {
    // items = trạng thái MỚI từ popup
    // trước đó (BEFORE) lấy từ editForm.items nếu có; nếu editForm null (mở từ list), dùng selectedItems
    const beforeArr = (editForm?.items && Array.isArray(editForm.items)) ? editForm.items : (selectedItems || []);
    const before = new Map(beforeArr.map(it => [it.courseId, it.quantity]));
    const after  = new Map(items.map(it => [it.courseId, it.quantity]));
  
    const toAdd = [...after.keys()].filter(k => !before.has(k)).map(k => ({ courseId: k, quantity: after.get(k) }));
    const toRemove = [...before.keys()].filter(k => !after.has(k));
    const toUpdate = [...after.keys()]
      .filter(k => before.has(k) && (before.get(k) ?? null) !== (after.get(k) ?? null))
      .map(k => ({ courseId: k, quantity: after.get(k) }));
  
    // Lấy id campaign từ editForm hoặc popupCampaign
    const campaignId = editForm?.id ?? popupCampaign?.id;
    if (!campaignId) {
      toast.error("Không xác định được campaignId");
      return;
    }
  
    try {
      if (toAdd.length) await addCoursesToCampaignWithQuota(campaignId, toAdd);
      if (toRemove.length) await removeCoursesFromCampaign(campaignId, toRemove);
      for (const it of toUpdate) {
        await setCourseQuota(campaignId, it.courseId, it.quantity);
      }
  
      // Cập nhật UI local
      if (editForm?.id === campaignId) {
        setEditForm({
          ...editForm,
          items,
          courseIds: items.map(x => x.courseId)
        });
      }
      // Đồng bộ lại row trong bảng (khi mở từ list)
      setPageData(prev => ({
        ...prev,
        content: prev.content.map(row =>
          row.id === campaignId
            ? { ...row, items, courseIds: items.map(x => x.courseId), courseCount: items.length }
            : row
        )
      }));
  
      toast.success("Cập nhật khoá học & quota OK");
    } catch (e) {
      console.error(e);
      toast.error("Cập nhật khoá học thất bại");
    }
  };
  
  

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso; // có thể là yyyy-MM-dd
    return d.toLocaleDateString("vi-VN");
  };

  const formatVND = (n) => {
    if (n == null || n === "") return "";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  };

  return (
    <div className="w-full mx-auto p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Sale Campaign Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo và quản lý các đợt khuyến mãi cho khoá học.
          </p>
        </div>
        <div className="flex-none">
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <FiPlus className="mr-2" />
            Tạo campaign
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              placeholder="Tìm kiếm theo tên/mô tả/id..."
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
            <option value={CAMPAIGN_TYPES.PERCENTAGE}>Phần trăm</option>
            <option value={CAMPAIGN_TYPES.FIXED}>Giá trị cố định</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="expired">Đã kết thúc</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiLayers className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Không có campaign</h3>
            <p className="text-gray-500">
              {pageData.totalElements === 0
                ? "Tạo campaign đầu tiên để bắt đầu."
                : "Không có campaign nào phù hợp."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại / Giá trị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoá học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs" title={c.description}>{c.description}</div>
                      <div className="text-xs text-gray-400 mt-1">ID: {c.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {c.type === CAMPAIGN_TYPES.PERCENTAGE
                          ? <FiPercent className="h-4 w-4 text-green-600 mr-2" />
                          : <FiDollarSign className="h-4 w-4 text-blue-600 mr-2" />
                        }
                        <div className="text-sm text-gray-900">
                          {c.type === CAMPAIGN_TYPES.PERCENTAGE
                            ? `${c.discountAmount}%`
                            : formatVND(c.discountAmount)}
                        </div>
                      </div>
                      {c.type === CAMPAIGN_TYPES.PERCENTAGE && (c.maxDiscountAmount ?? 0) > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Tối đa: {formatVND(c.maxDiscountAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="mr-2 h-4 w-4" />
                        <div>
                          <div>{formatDate(c.startDate)}</div>
                          <div className="text-xs">đến {formatDate(c.endDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <button
                            type="button"
                            onClick={() => openCoursePopupForRow(c)}
                            className="flex items-center group"
                            title="Quản lý khoá học của campaign này"
                        >
                            <FiBookOpen className="h-4 w-4 text-purple-600 mr-2" />
                            <span className="text-sm text-gray-700 underline group-hover:text-blue-600">
                            {(c.courseIds?.length ?? 0)} khoá học
                            </span>
                        </button>
                        </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(c)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(c)}
                          className={`transition-colors ${c.isActive
                            ? "text-green-600 hover:text-green-800"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                          title={c.isActive ? "Ngưng hoạt động" : "Kích hoạt"}
                        >
                          {c.isActive ? <FiToggleRight className="h-5 w-5" /> : <FiToggleLeft className="h-5 w-5" />}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === c.id ? null : c.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FiMoreVertical className="h-5 w-5" />
                          </button>
                          {openDropdown === c.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-10 border">
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  openEditModal(c);
                                  setOpenDropdown(null);
                                }}
                              >
                                <FiEdit2 className="mr-2 h-4 w-4" />
                                Sửa
                              </button>
                              <button
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  setOpenDropdown(null);
                                  handleDelete(c.id);
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

      {/* Create Modal */}
      {showCreate && (
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tạo Sale Campaign" size="lg">
          <form onSubmit={onSubmitCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã chiến dịch (ID)</label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.id}
                  onChange={e => setCreateForm({ ...createForm, id: e.target.value })}
                  placeholder="Để trống nếu BE tự sinh"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.type}
                  onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                >
                  <option value={CAMPAIGN_TYPES.PERCENTAGE}>Phần trăm</option>
                  <option value={CAMPAIGN_TYPES.FIXED}>Giá trị cố định</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị giảm</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.discountAmount}
                  onChange={e => setCreateForm({ ...createForm, discountAmount: e.target.value })}
                  required
                />
              </div>
            </div>

            {createForm.type === CAMPAIGN_TYPES.PERCENTAGE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giảm tối đa (áp cho %)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.maxDiscountAmount}
                  onChange={e => setCreateForm({ ...createForm, maxDiscountAmount: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bắt đầu</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.startDate}
                  onChange={e => setCreateForm({ ...createForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kết thúc</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={createForm.endDate}
                  onChange={e => setCreateForm({ ...createForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khoá học</label>
              <button
                type="button"
                onClick={openCoursePopupCreate}
                className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 text-left"
              >
                {createForm.courseIds.length ? `${createForm.courseIds.length} khoá học đã chọn` : "Chọn khoá học"}
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">
                Huỷ
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Tạo mới
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && editForm && (
        <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditForm(null); }} title="Chỉnh sửa Sale Campaign" size="lg">
          <form onSubmit={onSubmitEdit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
                <input className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500" value={editForm.id} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.type}
                  onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                >
                  <option value={CAMPAIGN_TYPES.PERCENTAGE}>Phần trăm</option>
                  <option value={CAMPAIGN_TYPES.FIXED}>Giá trị cố định</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị giảm</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.discountAmount}
                  onChange={e => setEditForm({ ...editForm, discountAmount: e.target.value })}
                  required
                />
              </div>
            </div>

            {editForm.type === CAMPAIGN_TYPES.PERCENTAGE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giảm tối đa (áp cho %)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.maxDiscountAmount}
                  onChange={e => setEditForm({ ...editForm, maxDiscountAmount: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bắt đầu</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.startDate}
                  onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kết thúc</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={editForm.endDate}
                  onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khoá học</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openCoursePopupEdit}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Quản lý khoá học ({(editForm.courseIds || []).length})
                </button>
                {(editForm.courseIds || []).length > 0 && (
                  <button
                    type="button"
                    className="px-3 py-2 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    onClick={() => {
                      // xoá hết
                      saveCoursesEdit([]);
                    }}
                  >
                    <FiX className="inline mr-1" /> Bỏ hết
                  </button>
                )}
              </div>
              {/* preview danh sách */}
              {(editForm.courseIds || []).length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-auto pr-1">
                  {editForm.courseIds.map(id => {
                    const c = courseMap[id];
                    return (
                      <div key={id} className="flex items-center p-2 border rounded-lg">
                        <img
                          src={c?.thumbnail}
                          alt={c?.title}
                          className="w-10 h-10 object-cover rounded border mr-2"
                        />
                        <div className="text-sm">
                          <div className="font-medium text-gray-800 line-clamp-1">{c?.title || id}</div>
                          <div className="text-xs text-gray-500">{id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowEdit(false); setEditForm(null); }} className="px-4 py-2 border rounded-lg">
                Huỷ
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Course Select Popup */}
      {showCoursePopup && (
  <CourseSelectPopupWithQuantity
    courses={courses}
    selected={selectedItems}
    onSave={(items) => {
      setShowCoursePopup(false);
      if (popupFor === "create") saveCoursesCreate(items);
      else saveCoursesEdit(items);
    }}
    onClose={() => setShowCoursePopup(false)}
  />
)}


    </div>
  );
}

// ===== Helpers in file =====
function getCampaignStatus(c, now = new Date()) {
  if (!c.isActive) return "inactive";
  const start = c.startDate ? new Date(c.startDate) : null;
  const end = c.endDate ? new Date(c.endDate) : null;

  if (end && end < now) return "expired";
  if (start && start > now) return "upcoming";
  return "active";
}

function renderStatusBadge(c) {
  const st = getCampaignStatus(c);
  const classes = {
    active: "bg-green-100 text-green-800",
    upcoming: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-800",
    inactive: "bg-gray-100 text-gray-800",
  };
  const text = {
    active: "Đang hoạt động",
    upcoming: "Sắp diễn ra",
    expired: "Đã kết thúc",
    inactive: "Ngưng hoạt động",
  };
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[st]}`}>
      {text[st]}
    </span>
  );
}

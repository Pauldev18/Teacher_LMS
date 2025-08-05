import { useState, useEffect } from "react";
import { FiTrash, FiSave, FiX } from "react-icons/fi";
import { fetchCourseFeatures, addCourseFeature, removeCourseFeature } from "../../services/courseFeatureApi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const CourseFeatureManager = ({ courseId, onClose }) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featureError, setFeatureError] = useState(null);
  const [newFeature, setNewFeature] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCourseFeatures(courseId)
      .then(setFeatures)
      .catch(e => setFeatureError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleAddFeature = async () => {
    if (!newFeature.trim()) return;
    setActionLoading(true);
    setFeatureError(null);
    try {
      await addCourseFeature(courseId, newFeature.trim());
      setFeatures([...features, { courseId, feature: newFeature.trim() }]);
      setNewFeature("");
      toast.success("Thêm tính năng thành công");
    } catch (e) {
        toast.error("Thêm tính năng thất bại");
      setFeatureError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFeature = async (feature) => {
    const result = await Swal.fire({
      title: "Bạn chắc chắn muốn xóa?",
      text: `Tính năng: ${feature}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    });
  
    if (!result.isConfirmed) return;
    setActionLoading(true);
    setFeatureError(null);
    try {
      await removeCourseFeature(courseId, feature);
      setFeatures(features.filter(f => f.feature !== feature));
      Swal.fire("Đã xóa!", "", "success");
    } catch (e) {
      setFeatureError(e.message);
      Swal.fire("Lỗi!", e.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"><FiX size={22}/></button>
        <h2 className="text-xl font-bold mb-4">Tính năng khóa học</h2>
        {featureError && <div className="text-red-500 text-sm mb-2">{featureError}</div>}

        {/* Danh sách feature */}
        <ul className="space-y-2 mb-4 max-h-52 overflow-y-auto">
          {features.map(f => (
            <li key={f.feature} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded">
              <span className="font-medium">{f.feature}</span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(f.feature)}
                className="text-red-500 hover:text-red-700 text-xs flex items-center"
                disabled={actionLoading}
              >
                <FiTrash className="mr-1" /> Xoá
              </button>
            </li>
          ))}
          {features.length === 0 && !loading && (
            <li className="text-gray-400 italic">Chưa có tính năng nào</li>
          )}
        </ul>

        {/* Thêm mới */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="form-input flex-1"
            placeholder="Nhập tính năng mới..."
            value={newFeature}
            onChange={e => setNewFeature(e.target.value)}
            disabled={actionLoading}
            onKeyDown={e => e.key === "Enter" && handleAddFeature()}
          />
          <button
            type="button"
            className="btn btn-primary flex items-center"
            onClick={handleAddFeature}
            disabled={actionLoading || !newFeature.trim()}
          >
            <FiSave className="mr-2" /> Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseFeatureManager;

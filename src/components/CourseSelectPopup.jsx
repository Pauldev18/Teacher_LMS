import { useState, useEffect } from "react";

const CourseSelectPopup = ({ courses, selectedIds, onSave, onClose }) => {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(selectedIds || []);

  useEffect(() => { setSelected(selectedIds) }, [selectedIds]);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(filter.trim().toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter((cid) => cid !== id) : [...selected, id]);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Chọn khoá học áp dụng</h2>
        <input
          type="text"
          className="input mb-2"
          placeholder="Tìm kiếm khoá học..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="flex-1 overflow-y-auto border rounded bg-gray-50 p-2">
          {filteredCourses.length === 0 ? (
            <div className="text-gray-500 text-sm">Không có khoá học nào</div>
          ) : (
            filteredCourses.map((course) => (
              <label key={course.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={selected.includes(course.id)}
                  onChange={() => toggleSelect(course.id)}
                  className="mr-2"
                />
                <span className="text-sm">{course.title}</span>
              </label>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn btn-outline" onClick={onClose}>
            Huỷ
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { onSave(selected); onClose(); }}
            disabled={selected.length === 0}
          >
            Lưu lựa chọn
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseSelectPopup;

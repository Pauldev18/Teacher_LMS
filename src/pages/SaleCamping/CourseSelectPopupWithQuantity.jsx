import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export default function CourseSelectPopupWithQuantity({
  courses = [],           // [{id,title,thumbnail}]
  selected = [],          // [{courseId, quantity}]  <-- dạng mới
  onSave, onClose
}) {
  const initialMap = useMemo(() => {
    const m = new Map();
    (selected || []).forEach(it => m.set(it.courseId, it.quantity ?? null));
    return m;
  }, [selected]);

  const [map, setMap] = useState(initialMap);

  useEffect(() => setMap(initialMap), [initialMap]);

  const toggle = (courseId) => {
    const m = new Map(map);
    if (m.has(courseId)) m.delete(courseId);
    else m.set(courseId, null); // default unlimited
    setMap(m);
  };

  const setQty = (courseId, val) => {
    const v = val === '' ? null : Math.max(0, Number(val));
    const m = new Map(map);
    if (m.has(courseId)) m.set(courseId, Number.isNaN(v) ? null : v);
    setMap(m);
  };

  const data = courses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Chọn khoá học & số lượng giảm</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-3 overflow-auto max-h-[60vh]">
          {data.map(c => {
            const checked = map.has(c.id);
            const qty = map.get(c.id) ?? '';
            return (
              <div key={c.id} className="flex items-center gap-3 p-2 border rounded-lg">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="w-4 h-4"
                />
                <img src={c.thumbnail} alt={c.title} className="w-12 h-12 rounded object-cover border" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{c.title}</div>
                  <div className="text-xs text-gray-500">{c.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Số lượng</span>
                  <input
                    type="number"
                    min={0}
                    value={qty}
                    onChange={e => setQty(c.id, e.target.value)}
                    placeholder="∞"
                    disabled={!checked}
                    className="w-24 px-2 py-1 border rounded disabled:bg-gray-100"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Huỷ</button>
          <button
            onClick={() => {
              const items = [...map.entries()].map(([courseId, quantity]) => ({ courseId, quantity }));
              onSave(items);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

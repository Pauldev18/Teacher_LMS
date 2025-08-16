// src/components/SkillsInput.jsx
import React, { useState, useEffect } from "react";

export default function SkillsInput({ value, onChange, placeholder = "Nhập kỹ năng, nhấn + hoặc Enter để thêm" }) {
  // value là string dạng "AI|Web|Mobile"
  const [input, setInput] = useState("");
  const [skills, setSkills] = useState([]);

  // parse value -> array khi mount/change từ ngoài
  useEffect(() => {
    const arr = (value || "")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean);
    setSkills(arr);
  }, [value]);

  const pushChange = (list) => {
    onChange?.(list.join("|")); // nối lại dạng "a|b|c"
  };

  const addSkill = () => {
    const s = input.trim();
    if (!s) return;
    if (skills.includes(s)) { setInput(""); return; }
    const next = [...skills, s];
    setSkills(next);
    setInput("");
    pushChange(next);
  };

  const removeSkill = (s) => {
    const next = skills.filter(x => x !== s);
    setSkills(next);
    pushChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Kỹ năng</label>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addSkill}
          className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          title="Thêm kỹ năng"
        >
          +
        </button>
      </div>

      {/* chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-sm">
            {s}
            <button type="button" onClick={() => removeSkill(s)} className="ml-1 hover:text-red-600">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

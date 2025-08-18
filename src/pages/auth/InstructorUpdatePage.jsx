import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import AxiosClient from "../../services/axiosInstance";
import { FiUpload, FiPlus, FiX, FiLoader, FiImage } from "react-icons/fi";

export default function InstructorUpdatePage() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    bio: "",
    website: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    expertises: "",
    profilePicture: "",
  });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await AxiosClient.get("/api/instructors/profile/me");
        setForm({
          name: data?.name || "",
          title: data?.title || "",
          bio: data?.bio || "",
          website: data?.website || "",
          twitter: data?.twitter || "",
          linkedin: data?.linkedin || "",
          youtube: data?.youtube || "",
          expertises: data?.expertises || "",
          profilePicture: data?.profilePicture || "",
        });
        setSkills((data?.expertises || "")
          .split("|")
          .map(s => s.trim())
          .filter(Boolean));
      } catch (e) {
        console.error(e);
        Swal.fire("Lỗi", "Không tải được thông tin giảng viên", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setForm(prev => ({ ...prev, expertises: skills.join("|") }));
  }, [skills]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    const v = (skillInput || "").trim();
    if (!v) return;
    if (!skills.some(s => s.toLowerCase() === v.toLowerCase())) {
      setSkills(prev => [...prev, v]);
    }
    setSkillInput("");
  };

  const removeSkill = (i) => setSkills(prev => prev.filter((_, idx) => idx !== i));

  const keySkill = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const avatar = useMemo(() => {
    return form.profilePicture?.trim()
      ? form.profilePicture.trim()
      : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(form.name || "Instructor")}`;
  }, [form.profilePicture, form.name]);

  const openFile = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const okTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!okTypes.includes(file.type)) {
      Swal.fire("Lỗi", "Chỉ chấp nhận PNG, JPG, WEBP", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Lỗi", "Ảnh tối đa 5MB", "error");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await AxiosClient.post("/api/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data?.url) throw new Error("Upload không trả về URL");
      setForm(prev => ({ ...prev, profilePicture: data.url }));
      Swal.fire("Thành công", "Đã upload ảnh đại diện!", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", err?.response?.data?.message || "Không upload được ảnh", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, expertises: skills.join("|") };
      const { data } = await AxiosClient.put("/api/instructors/me", payload);
      Swal.fire("Thành công", "Cập nhật thông tin giảng viên thành công!", "success");
      setForm({
        name: data?.name || "",
        title: data?.title || "",
        bio: data?.bio || "",
        website: data?.website || "",
        twitter: data?.twitter || "",
        linkedin: data?.linkedin || "",
        youtube: data?.youtube || "",
        expertises: data?.expertises || "",
        profilePicture: data?.profilePicture || "",
      });
      setSkills((data?.expertises || "").split("|").map(s=>s.trim()).filter(Boolean));
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", err?.response?.data?.message || "Không thể cập nhật", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-2 text-primary-500">
            <FiLoader className="animate-spin" /> Đang tải profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header giống page Courses */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Cập nhật thông tin của bạn</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        {/* Card Avatar */}
        <div className="card p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={avatar}
                alt="avatar"
                className="w-36 h-36 rounded-full object-cover ring-4 ring-gray-100"
              />
              {!form.profilePicture && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded">
                  <FiImage className="inline-block -mt-0.5 mr-1" /> Auto avatar
                </span>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-500 break-all max-w-[280px]">
              {form.profilePicture || "Chưa có ảnh"}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={openFile}
                className="btn btn-outline flex items-center gap-2"
                disabled={uploading}
              >
                {uploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
                {uploading ? "Đang tải..." : "Chọn & Upload"}
              </button>
              {form.profilePicture && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, profilePicture: "" }))}
                  className="btn btn-light"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={onFile}
            />
          </div>
        </div>

        {/* Card Form */}
        <form className="card p-6 space-y-6" onSubmit={onSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Tên</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="form-input"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Chức danh</label>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                className="form-input"
                placeholder="Senior Java Developer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Giới thiệu</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={onChange}
              rows={4}
              className="form-input min-h-[120px]"
              placeholder="Giảng viên có hơn 10 năm kinh nghiệm..."
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Website</label>
            <input
              name="website"
              value={form.website}
              onChange={onChange}
              className="form-input"
              placeholder="https://nguyenvana.dev"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Twitter</label>
              <input
                name="twitter"
                value={form.twitter}
                onChange={onChange}
                className="form-input"
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className="block text-sm mb-1">LinkedIn</label>
              <input
                name="linkedin"
                value={form.linkedin}
                onChange={onChange}
                className="form-input"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-sm mb-1">YouTube</label>
              <input
                name="youtube"
                value={form.youtube}
                onChange={onChange}
                className="form-input"
                placeholder="https://youtube.com/@..."
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Ảnh đại diện (URL)</label>
              <input
                name="profilePicture"
                disabled
                value={form.profilePicture}
                onChange={onChange}
                className="form-input"
                placeholder="https://example.com/images/avatar.jpg"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm mb-2">Kỹ năng</label>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={keySkill}
                className="form-input flex-1"
                placeholder="Nhập kỹ năng rồi nhấn + hoặc Enter"
              />
              <button
                type="button"
                onClick={addSkill}
                className="btn btn-primary inline-flex items-center gap-1"
              >
                <FiPlus /> Thêm
              </button>
            </div>

            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {s}
                    <button
                      type="button"
                      className="hover:text-red-600"
                      onClick={() => removeSkill(i)}
                      title="Xóa"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

          
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary inline-flex items-center gap-2">
              {saving ? <FiLoader className="animate-spin" /> : null}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

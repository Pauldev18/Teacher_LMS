import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import AxiosClient from '../../services/axiosInstance';

export default function AdminSendHtmlMailModal({ open, onClose, defaultEmails = [] }) {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('<p>Xin chào, ...</p>');
  const [previewHtml, setPreviewHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const [QuillEditor, setQuillEditor] = useState(null);
  useEffect(() => {
    let mounted = true;
    if (typeof window !== 'undefined') {
      import('react-quill')
        .then(mod => mounted && setQuillEditor(() => mod.default))
        .catch(err => console.error('Load react-quill error:', err));
    }
    return () => { mounted = false; };
  }, []);

  const quillRef = useRef(null);

  const emails = useMemo(() => (defaultEmails || []).filter(Boolean), [defaultEmails]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Ảnh quá lớn', text: 'Giới hạn 5MB' });
        return;
      }

      try {
        const form = new FormData();
        form.append('file', file);
        const { data } = await AxiosClient.post('/api/upload/image', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const url = data?.url;
        if (!url) throw new Error('Không nhận được URL ảnh');

        const quill = quillRef.current?.getEditor?.();
        const range = quill?.getSelection(true) || { index: 0 };
        quill?.insertEmbed(range.index, 'image', url, 'user');
        quill?.setSelection(range.index + 1);
      } catch (e) {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Upload ảnh thất bại', text: e?.message || 'Lỗi không xác định' });
      }
    };
    input.click();
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: { image: handleImageUpload }
    }
  }), [handleImageUpload]);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'align', 'link', 'image'
  ];

  if (!open) return null;

  const copyAll = async () => {
    try { await navigator.clipboard.writeText(emails.join(', ')); } catch (_) {}
  };

  const handleSend = async () => {
    setResult(null);
    if (!emails.length) {
      Swal.fire({ icon: 'warning', title: 'Thiếu người nhận', text: 'Chưa có email nào.' });
      return;
    }
    if (!subject.trim()) {
      Swal.fire({ icon: 'warning', title: 'Thiếu tiêu đề', text: 'Vui lòng nhập tiêu đề email.' });
      return;
    }
    const plain = htmlContent.replace(/<(.|\n)*?>/g, '').trim();
    if (!plain) {
      Swal.fire({ icon: 'warning', title: 'Thiếu nội dung', text: 'Vui lòng nhập nội dung email.' });
      return;
    }

    setSending(true);
    try {
      const { data: res } = await AxiosClient.post('/api/mail/send-html', {
        emails,
        subject,
        htmlContent
      });

      const normalized = {
        success: Number(res?.success ?? 0),
        total: Number(res?.total ?? emails.length),
        failed: Array.isArray(res?.failed) ? res.failed : [],
      };
      normalized.sent = emails.filter(e => !normalized.failed.includes(e));
      setResult(normalized);

      if (normalized.failed.length) {
        Swal.fire({
          icon: 'warning',
          title: `Đã gửi ${normalized.success}/${normalized.total}`,
          html: `
            <div style="text-align:left">
              <div><b>Thất bại (${normalized.failed.length}):</b></div>
              <ul style="margin:6px 0 0 18px">
                ${normalized.failed.map(e => `<li>${e}</li>`).join('')}
              </ul>
            </div>
          `
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: `Thành công ${normalized.success}/${normalized.total}`,
          timer: 1800,
          showConfirmButton: false
        });
      }
    } catch (e) {
      console.error(e);
      setResult({ success: 0, total: emails.length, failed: emails, sent: [] });
      Swal.fire({ icon: 'error', title: 'Gửi thất bại', text: e?.response?.data?.error || e?.message || 'Lỗi không xác định' });
    } finally {
      setSending(false);
    }
  };

  const quillClass = 'quill h-full';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-[min(1100px,95vw)] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b shrink-0 flex items-center justify-between bg-white/70 backdrop-blur">
          <h3 className="text-lg font-semibold">Gửi email</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6 pt-5 pb-3">
          <div className="h-full grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="min-h-0 flex flex-col gap-4 overflow-hidden">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Người nhận</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{emails.length} người</span>
                    <button
                      onClick={copyAll}
                      type="button"
                      className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-lg border hover:bg-gray-50"
                      title="Copy tất cả"
                    >
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {emails.length ? emails.map((em, idx) => (
                    <span key={`${em}-${idx}`} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs border">
                      {em}
                    </span>
                  )) : <span className="text-xs text-gray-400">Không có người nhận</span>}
                </div>
                <textarea className="form-textarea w-full mt-2 opacity-60 cursor-not-allowed" rows={2} value={emails.join(', ')} disabled readOnly />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Tiêu đề</label>
                <input
                  className="form-input w-full"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="VD: Thông báo lịch học"
                />
              </div>

              <div className="flex-1 min-h-0">
                <label className="block text-sm text-gray-600 mb-1">Nội dung</label>
                <div className="border rounded-xl h-full flex flex-col">
                  {QuillEditor ? (
                    <QuillEditor
                      ref={quillRef}
                      theme="snow"
                      value={htmlContent}
                      onChange={setHtmlContent}
                      modules={modules}
                      formats={formats}
                      className={quillClass}
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-gray-500">Đang tải trình soạn thảo…</div>
                  )}
                </div>
              </div>

              {result && (
                <div className={`mt-1 rounded-lg border p-3 ${result.failed?.length ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {result.failed?.length ? (
                      <>
                        <AlertTriangle className="text-amber-600" size={18} />
                        <span className="text-amber-700">Đã gửi {result.success}/{result.total}. Thất bại: {result.failed.length}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="text-emerald-600" size={18} />
                        <span className="text-emerald-700">Thành công {result.success}/{result.total}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-xl overflow-hidden min-h-0 flex flex-col">
              <div className="px-3 py-2 border-b bg-gray-50 text-sm text-gray-600 shrink-0">Preview</div>
              <div className="p-4 overflow-auto flex-1">
                {previewHtml
                  ? <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  : <div className="text-gray-400 text-sm">Nhấn Preview để xem trước nội dung...</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={() => setPreviewHtml(htmlContent)} className="inline-flex items-center gap-2 btn btn-outline">
            Preview
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center gap-2 btn btn-primary disabled:opacity-60"
            disabled={sending || !QuillEditor}
          >
            {sending && <Loader2 className="animate-spin" size={16} />}
            {sending ? 'Đang gửi...' : 'Gửi'}
          </button>
          <button type="button" onClick={onClose} className="btn">Đóng</button>
        </div>
      </div>

      <style jsx global>{`
        /* Keep toolbar visible and remove double scrollbars */
        .quill { display: flex; flex-direction: column; height: 100%; }
        .quill .ql-toolbar { position: sticky; top: 0; z-index: 20; background: #fff; border: 0; border-bottom: 1px solid #e5e7eb; }
        /* Remove inner scrollbar; allow outer column to scroll */
        .quill .ql-container { flex: 1; height: auto; overflow: hidden; border: 0; }
        .quill .ql-editor { min-height: 26rem; padding-bottom: 2.5rem; overflow: auto; }
        @media (min-width: 768px) { .quill .ql-editor { min-height: 30rem; } }
        .quill .ql-editor img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}

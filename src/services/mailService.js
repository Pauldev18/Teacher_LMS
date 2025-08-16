import AxiosClient from "./axiosInstance";


/**
 * Gửi email HTML tuỳ chỉnh cho một/multiple người nhận.
 * @param {{ emails: string[], subject: string, htmlContent: string }} payload
 * @returns {Promise<{ total: number, success: number, failed: string[] }>}
 */
export async function adminSendHtmlMail(payload) {
  // (Tuỳ chọn) validate nhanh phía client
  if (!payload || !Array.isArray(payload.emails) || payload.emails.length === 0) {
    throw new Error('Vui lòng cung cấp ít nhất 1 email người nhận.');
  }
  if (!payload.subject || !payload.subject.trim()) {
    throw new Error('Vui lòng nhập tiêu đề email.');
  }
  if (!payload.htmlContent || !payload.htmlContent.trim()) {
    throw new Error('Vui lòng nhập nội dung HTML.');
  }

  const res = await AxiosClient.post('/api/mail/send-html', payload);
  return res.data;
}

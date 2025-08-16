import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Mail, Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { forgotPassword, verifyOtp, resetPassword } from '../../services/Auth';

const EMAIL = 0;
const OTP = 1;
const NEWPASS = 2;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(EMAIL);

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [otpInputs, setOtpInputs] = useState(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef([]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS);

  const otp = useMemo(() => otpInputs.join(''), [otpInputs]);

  useEffect(() => {
    let t;
    if (step === OTP && emailSent && resendLeft > 0) {
      t = setTimeout(() => setResendLeft((s) => s - 1), 1000);
    }
    return () => t && clearTimeout(t);
  }, [step, emailSent, resendLeft]);

  function resetAll() {
    setStep(EMAIL);
    setEmail('');
    setEmailSent(false);
    setOtpInputs(Array(OTP_LENGTH).fill(''));
    setPassword('');
    setConfirm('');
    setErr('');
    setOkMsg('');
    setResendLeft(RESEND_SECONDS);
  }

  // --------- Gửi OTP vào email ----------
  async function handleSendEmail(e) {
    e.preventDefault();
    setErr('');
    setOkMsg('');
    if (!email.trim()) {
      setErr('Vui lòng nhập email');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setEmailSent(true);
      setOkMsg('Đã gửi OTP tới email của bạn.');
      setStep(OTP);
      setResendLeft(RESEND_SECONDS);
      // focus ô OTP đầu tiên
      setTimeout(() => otpRefs.current?.[0]?.focus(), 0);
    } catch (e) {
      const msg = e?.response?.data?.message  || 'Gửi OTP thất bại.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  // --------- Xác thực OTP ----------
  function handleChangeOtp(i, v) {
    if (v.length > 1) {
      // paste nhiều ký tự
      const chars = v.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newArr = [...otpInputs];
      for (let k = 0; k < OTP_LENGTH; k++) {
        newArr[k] = chars[k] || '';
      }
      setOtpInputs(newArr);
      const next = Math.min(chars.length, OTP_LENGTH - 1);
      otpRefs.current[next]?.focus();
      return;
    }

    if (!/^\d?$/.test(v)) return;
    const arr = [...otpInputs];
    arr[i] = v;
    setOtpInputs(arr);
    if (v && i < OTP_LENGTH - 1) {
      otpRefs.current[i + 1]?.focus();
    }
  }

  function handleKeyDownOtp(i, e) {
    if (e.key === 'Backspace' && !otpInputs[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setErr('');
    setOkMsg('');
    if (otp.length !== OTP_LENGTH) {
      setErr(`Vui lòng nhập đủ ${OTP_LENGTH} số OTP.`);
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp);
      setOkMsg('OTP hợp lệ, vui lòng đặt mật khẩu mới.');
      setStep(NEWPASS);
    } catch (e) {
      const msg = e?.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(e) {
    e.preventDefault();
    if (resendLeft > 0) return;
    setErr('');
    setOkMsg('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setOkMsg('Đã gửi lại OTP.');
      setOtpInputs(Array(OTP_LENGTH).fill(''));
      setResendLeft(RESEND_SECONDS);
      setTimeout(() => otpRefs.current?.[0]?.focus(), 0);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Gửi lại OTP thất bại.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  // --------- Đặt mật khẩu mới ----------
  const pwdStrength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0-5
  }, [password]);

  async function handleResetPassword(e) {
    e.preventDefault();
    setErr('');
    setOkMsg('');
    if (password.length < 8) {
      setErr('Mật khẩu tối thiểu 8 ký tự.');
      return;
    }
    if (password !== confirm) {
      setErr('Xác nhận mật khẩu không khớp.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), otp, password);
      setOkMsg('Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.');
      // chuyển về login sau 1.5s
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Đổi mật khẩu thất bại.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => (step === EMAIL ? navigate('/login') : setStep(step - 1))}
            className="mr-2 text-gray-500 hover:text-gray-700"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === EMAIL && 'Quên mật khẩu'}
            {step === OTP && 'Nhập mã OTP'}
            {step === NEWPASS && 'Đặt mật khẩu mới'}
          </h1>
        </div>

        {(err || okMsg) && (
          <div className={`mb-4 p-3 rounded-md flex items-center ${err ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {err ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            <span>{err || okMsg}</span>
          </div>
        )}

        {/* Step 1: nhập email */}
        {step === EMAIL && (
          <form onSubmit={handleSendEmail} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email của bạn</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Chúng tôi sẽ gửi mã OTP gồm {OTP_LENGTH} số tới email này.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</span> : 'Gửi OTP'}
            </button>
          </form>
        )}

        {/* Step 2: nhập OTP */}
        {step === OTP && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                Nhập mã OTP đã gửi đến <span className="font-medium">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => setStep(EMAIL)}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                Thay đổi email
              </button>
            </div>

            <div className="flex justify-between gap-2">
              {otpInputs.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={val}
                  onChange={(e) => handleChangeOtp(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDownOtp(i, e)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendLeft > 0}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                Gửi lại OTP {resendLeft > 0 ? `(${resendLeft}s)` : ''}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Xác nhận OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: đặt mật khẩu mới */}
        {step === NEWPASS && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500"
                >
                  {showPwd ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              {/* Thanh strength đơn giản */}
              <div className="mt-2 h-2 bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${pwdStrength <= 2 ? 'bg-red-500' : pwdStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${(pwdStrength / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nên có chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500"
                >
                  {showConfirm ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang đổi...</span> : 'Đổi mật khẩu'}
            </button>

            <div className="text-center text-sm text-gray-600">
              <span>Nhớ lại mật khẩu? </span>
              <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
            </div>
          </form>
        )}

        {/* Footer nhỏ */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Quay lại{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              trang đăng nhập
            </Link>
          </p>
        </div>

        {/* Reset toàn bộ (debug) */}
        <div className="mt-4 text-center">
          <button onClick={resetAll} className="text-xs text-gray-400 hover:text-gray-600">Làm lại từ đầu</button>
        </div>
      </div>
    </div>
  );
}

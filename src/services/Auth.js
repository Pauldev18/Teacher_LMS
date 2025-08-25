import AxiosClient from '../services/axiosInstance';

export async function apiLogin(email, password) {
  try {
    const res = await AxiosClient.post('/api/auth/login', { email, password });
    const { token, id, email: userEmail, name, roles } = res.data;

    const roleNames = (roles || [])
      .map(r => (r?.authority ?? r))
      .map(s => String(s).toUpperCase());

    const allowed = roleNames.includes('ROLE_INSTRUCTOR') || roleNames.includes('ROLE_ADMIN');
    if (!allowed) throw new Error('Bạn không có quyền truy cập hệ thống này.');

    const user = { id, email: userEmail, name, token, roles };
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (err) {
    throw err;
  }
}


export const register = async (name, email, password) => {
  const res = await AxiosClient.post("/api/auth/register", {
    name,
    email,
    password
  });
  return res.data; 
};


export async function forgotPassword(email) {
  const res = await AxiosClient.post('/api/auth/forgot-password', { email });
  return res.data;
}

export async function verifyOtp(email, otp) {
  const res = await AxiosClient.post('/api/auth/verify-otp', { email, otp });
  return res.data;
}

export async function resetPassword(email, otp, newPassword) {
  const res = await AxiosClient.post('/api/auth/reset-password', {
    email,
    otp,
    newPassword,
  });
  return res.data;
}
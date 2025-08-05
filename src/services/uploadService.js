import AxiosClient from './axiosInstance';

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await AxiosClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data || 'Lỗi upload file');
  }
};

export const validateImageFile = (file) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn file ảnh');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB');
  }

  return true;
};
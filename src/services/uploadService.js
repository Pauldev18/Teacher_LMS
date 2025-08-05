const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const imageUrl = await response.text();
    return imageUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
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
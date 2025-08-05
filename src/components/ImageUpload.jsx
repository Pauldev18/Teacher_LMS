import { useState, useRef, useEffect } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { uploadFile, validateImageFile } from '../services/uploadService';

const ImageUpload = ({ value, onChange, label = "Upload Image", accept = "image/*" }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const fileInputRef = useRef(null);

  // Sync preview with external value changes
  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Validate file
      validateImageFile(file);
      
      setUploading(true);
      
      // Upload file using service
      const imageUrl = await uploadFile(file);
      
      // Update preview and call onChange
      setPreview(imageUrl);
      onChange(imageUrl);
      
      toast.success('Upload ảnh thành công');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const fakeEvent = {
        target: {
          files: [file]
        }
      };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {preview ? (
          /* Preview */
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Upload Interface */
          <div>
            <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {uploading ? 'Đang upload...' : 'Kéo thả ảnh vào đây hoặc'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <FiUpload className="mr-2 h-4 w-4" />
                Chọn ảnh
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, GIF tối đa 5MB
            </p>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {/* Manual URL input as fallback */}
      {!preview && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Hoặc nhập URL ảnh:
          </label>
          <input
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
            value={value || ''}
            onChange={(e) => {
              onChange(e.target.value);
              setPreview(e.target.value);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
import { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiImage, FiSmile, FiMessageSquare, FiX } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../../hooks/useAuth';

const Messages = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Thêm state previewFile để lưu đối tượng file đang chọn
  const [previewFile, setPreviewFile] = useState(null);
  
  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'Alex Johnson',
      lastMessage: 'Thank you for the feedback!',
      unread: 2,
      messages: [
        {
          id: 1,
          sender: 'Alex Johnson',
          content: 'Hi professor, I have a question about the last lecture',
          timestamp: '2024-03-15T10:30:00Z',
          type: 'text'
        },
        {
          id: 2,
          sender: 'Dr. Sarah Johnson',
          content: 'Of course! What would you like to know?',
          timestamp: '2024-03-15T10:35:00Z',
          type: 'text'
        },
        {
          id: 3,
          sender: 'Alex Johnson',
          content: 'Thank you for the feedback!',
          timestamp: '2024-03-15T10:40:00Z',
          type: 'text'
        }
      ]
    },
    {
      id: 2,
      name: 'Maya Patel',
      lastMessage: 'Here is my assignment submission',
      unread: 0,
      messages: [
        {
          id: 1,
          sender: 'Maya Patel',
          content: 'Here is my assignment submission',
          timestamp: '2024-03-14T15:20:00Z',
          type: 'text'
        }
      ]
    }
  ]);
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('button')
      ) {
        setShowEmojiPicker(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSendMessage = () => {
    // Nếu có file preview, xử lý gửi message kiểu file/ảnh
    if (previewFile) {
      const newMessage = {
        id: Date.now(),
        sender: user.name,
        // Nội dung có thể là tên file, hoặc bạn có thể implement thêm logic upload file
        content: previewFile.file.name,
        timestamp: new Date().toISOString(),
        type: previewFile.type.startsWith('image/') ? 'image' : 'file'
      };
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id
            ? {
                ...chat,
                messages: [...chat.messages, newMessage],
                lastMessage: previewFile.file.name
              }
            : chat
        )
      );
      setPreviewFile(null);
    } else if (message.trim()) {
      // Gửi message text
      const newMessage = {
        id: Date.now(),
        sender: user.name,
        content: message,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      console.log('Sending message:', newMessage);
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id
            ? {
                ...chat,
                messages: [...chat.messages, newMessage],
                lastMessage: message
              }
            : chat
        )
      );
      setMessage('');
      setShowEmojiPicker(false);
    }
  };
  
  // Hàm xử lý file upload cho file nói chung (không riêng ảnh)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Tạo URL preview để hiển thị file/ảnh trước khi gửi
    const previewUrl = URL.createObjectURL(file);
    setPreviewFile({ file, previewUrl, type: file.type });
    
    // Reset value để có thể chọn lại file cùng tên nếu cần
    event.target.value = null;
  };
  
  // Hàm xử lý khi chọn emoji
  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
  };
  
  return (
    <div className="h-[calc(100vh-6rem)] flex">
      {/* Chat list */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {chats.map(chat => (
            <button
              key={chat.id}
              className={`w-full p-4 text-left hover:bg-gray-50 ${
                selectedChat?.id === chat.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                  {chat.name.charAt(0)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{chat.name}</p>
                    {chat.unread > 0 && (
                      <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white border-b">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                  {selectedChat.name.charAt(0)}
                </div>
                <h2 className="ml-3 text-lg font-medium">{selectedChat.name}</h2>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedChat.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex mb-4 ${
                    msg.sender === user.name ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender === user.name
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    {msg.type === 'file' || msg.type === 'image' ? (
                      <div className="flex items-center">
                        <FiPaperclip className="mr-2" />
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${
                      msg.sender === user.name ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
            
            {/* Preview File/Ảnh (nếu có) */}
            {previewFile && (
              <div className="p-4 bg-white border-t flex items-center justify-between">
                <div className="flex items-center">
                  {previewFile.type.startsWith('image/') ? (
                    <img
                      src={previewFile.previewUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded mr-3"
                    />
                  ) : (
                    <FiPaperclip className="h-6 w-6 text-gray-600 mr-3" />
                  )}
                  <span className="text-gray-800">
                    {previewFile.file.name}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {/* Message input */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiPaperclip className="h-5 w-5" />
                </button>
                {/* Input ẩn cho file (dùng chung cho file và ảnh nếu cần) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                {/* Nếu muốn có nút riêng cho ảnh, bạn có thể tạo thêm ref và hàm xử lý riêng */}
                <button
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <FiImage className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div className="relative">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <FiSmile className="h-5 w-5" />
                  </button>
                  
                  {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="absolute bottom-12 right-0">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  onFocus={() => setShowEmojiPicker(false)}
                  placeholder="Type a message..."
                  className="flex-1 form-input"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() && !previewFile}
                  className="p-2 text-primary-500 hover:text-primary-600 disabled:text-gray-400"
                >
                  <FiSend className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Select a chat</h3>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;

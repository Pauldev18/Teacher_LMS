import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiVideo, FiArrowRight, FiKey } from 'react-icons/fi'

const randomRoomId = () => Math.random().toString(36).slice(2, 8)

export default function MeetHome() {
  const [displayName, setDisplayName] = useState(localStorage.getItem('displayName') || '')
  const [roomInput, setRoomInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const createRoom = () => {
    const id = randomRoomId()
    if (displayName.trim()) localStorage.setItem('displayName', displayName.trim())
    navigate(`/meet/${id}`)
  }

  const joinRoom = () => {
    if (!roomInput.trim()) {
      setError('Vui lòng nhập Room ID')
      return
    }
    setError('')
    if (displayName.trim()) localStorage.setItem('displayName', displayName.trim())
    navigate(`/meet/${roomInput.trim()}`)
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-lg">
              <FiVideo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mini Meet</h1>
              <p className="text-sm text-gray-500">
                Tạo phòng họp mới hoặc nhập Room ID để tham gia
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/70 backdrop-blur border border-gray-100 shadow-sm rounded-2xl p-6">
          {/* Display name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
          <input
            className="w-full rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 transition"
            placeholder="VD: Nguyễn Văn A"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">Tên này sẽ hiển thị trong phòng họp.</p>

          {/* Create */}
          <button
            onClick={createRoom}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 font-medium shadow-sm transition"
          >
            Tạo phòng mới
            <FiArrowRight className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs uppercase tracking-widest text-gray-400">hoặc</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Join by ID */}
          <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`w-full rounded-xl border px-10 py-2 transition focus:ring-2 focus:border-indigo-500 ${
                  error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="vd: abc123"
                value={roomInput}
                onChange={(e) => { setRoomInput(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>
            <button
              onClick={joinRoom}
              className="rounded-xl border border-gray-300 hover:border-indigo-500 hover:text-indigo-600 px-4 py-2 font-medium transition"
            >
              Tham gia
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        {/* Tips */}
        <div className="mt-4 text-xs text-gray-400">
          Mẹo: Nhấn <kbd className="px-1.5 py-0.5 rounded border bg-gray-50">Enter</kbd> để tham gia nhanh.
        </div>
      </div>
    </div>
  )
}

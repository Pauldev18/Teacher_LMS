import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import VideoRoom from './VideoRoom'

export default function MeetRoom() {
  const { roomId } = useParams()
  const [name] = useState(() => localStorage.getItem('displayName') || ('user-' + Math.floor(Math.random()*9999)))
  const username = useMemo(() => name, [name])

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Meet · Room <code>{roomId}</code></h2>
      <VideoRoom roomId={roomId} username={username} />
    </div>
  )
}

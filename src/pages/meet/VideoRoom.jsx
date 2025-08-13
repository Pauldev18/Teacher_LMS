import React, { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { FiCopy, FiMonitor, FiSquare, FiVideo, FiVideoOff, FiMic, FiMicOff } from 'react-icons/fi'

const WS_BASE  = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
const TURN_URL = import.meta.env.VITE_TURN_URL
const TURN_USER = import.meta.env.VITE_TURN_USERNAME
const TURN_PASS = import.meta.env.VITE_TURN_CREDENTIAL

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(TURN_URL && TURN_USER && TURN_PASS
    ? [{ urls: TURN_URL, username: TURN_USER, credential: TURN_PASS }]
    : [])
]

export default function VideoRoom({ roomId, username }) {
  // ===== refs & state =====
  const clientRef = useRef(null)
  const selfIdRef = useRef('')

  const localStreamRef = useRef(null)
  const selfPreviewRef = useRef(null)

  const screenStreamRef = useRef(null)
  const shareVideoRef = useRef(null)

  const peersRef = useRef(new Map()) // peerId -> { pc, flag accessors... }

  const [participants, setParticipants] = useState([]) // [{id, username, media?:{video,audio,sharing}}]
  const [remoteStreams, setRemoteStreams] = useState({}) // peerId -> MediaStream
  const [chats, setChats] = useState([])

  const [mediaReady, setMediaReady] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)

  // ===== helpers =====
  const publishSafe = (destination, bodyObj) => {
    const c = clientRef.current
    if (c && c.connected) c.publish({ destination, body: JSON.stringify(bodyObj) })
  }

  const updateParticipantMedia = (peerId, media) => {
    setParticipants(prev =>
      prev.map(p => (p.id === peerId ? { ...p, media: { ...(p.media || {}), ...media } } : p))
    )
  }

  const getActiveVideoTrack = () => {
    const sTrack = screenStreamRef.current?.getVideoTracks?.()[0]
    if (isSharing && sTrack) return sTrack
    return localStreamRef.current?.getVideoTracks?.()[0] || null
  }

  // ===== Perfect Negotiation: create/get peer =====
  const getOrCreatePeer = (peerId) => {
    let p = peersRef.current.get(peerId)
    if (p) return p

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    // flags
    let makingOffer = false
    let ignoreOffer = false
    let negotiateQueued = false

    pc.oniceconnectionstatechange = () => console.log('[ICE]', peerId, pc.iceConnectionState)
    pc.onconnectionstatechange = () => console.log('[PC]', peerId, pc.connectionState)
    pc.onsignalingstatechange = () => console.log('[SIG]', peerId, pc.signalingState)

    // add local tracks safely (audio + active video)
    const addLocalTracksSafely = () => {
      const baseStream = localStreamRef.current
      const senders = pc.getSenders()

      // AUDIO
      if (baseStream) {
        const a = baseStream.getAudioTracks()[0]
        if (a) {
          const aSender = senders.find(s => s.track && s.track.kind === 'audio')
          if (aSender) {
            if (aSender.track?.id !== a.id) aSender.replaceTrack(a)
          } else {
            pc.addTrack(a, baseStream)
          }
        }
      }

      // VIDEO (camera hoặc screen đang active)
      const vTrack = getActiveVideoTrack()
      if (vTrack) {
        const vSender = senders.find(s => s.track && s.track.kind === 'video')
        if (vSender) {
          if (vSender.track?.id !== vTrack.id) vSender.replaceTrack(vTrack)
        } else {
          const ms = baseStream ? baseStream : new MediaStream([vTrack])
          pc.addTrack(vTrack, ms)
        }
      }
    }
    addLocalTracksSafely()

    pc.ontrack = (ev) => {
      const ms = ev.streams[0]
      setRemoteStreams(prev => ({ ...prev, [peerId]: ms }))
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        publishSafe('/app/webrtc.ice', { type: 'ICE', to: peerId, candidate: ev.candidate })
      }
    }

    pc.onnegotiationneeded = async () => {
      // tránh tạo offer khi chưa stable (đang xử lý remote-offer)
      if (pc.signalingState !== 'stable') return
      if (negotiateQueued || makingOffer) return
      negotiateQueued = true
      await Promise.resolve() // gộp thay đổi
      negotiateQueued = false
      try {
        makingOffer = true
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        publishSafe('/app/webrtc.offer', { type: 'OFFER', to: peerId, sdp: offer })
      } catch (e) {
        console.warn('onnegotiationneeded error', e)
      } finally {
        makingOffer = false
      }
    }

    p = {
      pc,
      makingOfferRef: () => makingOffer,
      setMakingOffer: v => (makingOffer = v),
      ignoreOfferRef: () => ignoreOffer,
      setIgnoreOffer: v => (ignoreOffer = v),
    }
    peersRef.current.set(peerId, p)
    return p
  }

  const makeInitialOfferTo = async (peerId) => {
    const p = getOrCreatePeer(peerId)
    const { pc, setMakingOffer } = p
    try {
      setMakingOffer(true)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      publishSafe('/app/webrtc.offer', { type: 'OFFER', to: peerId, sdp: offer })
    } catch (e) {
      console.warn('makeInitialOfferTo error', e)
    } finally {
      setMakingOffer(false)
    }
  }

  // ===== init camera/mic =====
  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream

      setIsVideoOn(stream.getVideoTracks().some(t => t.enabled !== false))
      setIsAudioOn(stream.getAudioTracks().some(t => t.enabled !== false))

      setMediaReady(true)

      // self preview
      if (selfPreviewRef.current) {
        selfPreviewRef.current.srcObject = stream
        selfPreviewRef.current.muted = true
        try { await selfPreviewRef.current.play() } catch {}
      }
    })()
  }, [])

  // ===== STOMP connect AFTER media ready =====
  useEffect(() => {
    if (!mediaReady) return
    if (clientRef.current) return

    const sock = new SockJS(`${WS_BASE}/ws`)
    const c = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 2000,
      debug: () => {}
    })
    clientRef.current = c

    c.onConnect = () => {
      console.log('[STOMP] connected')

      // Private
      c.subscribe('/user/queue/signal', async (frame) => {
        const msg = JSON.parse(frame.body)

        if (msg.type === 'JOIN_ACK') {
          selfIdRef.current = msg.selfId
          setParticipants(msg.participants || [])

          // broadcast media state hiện tại (kèm sharing)
          publishSafe('/app/meet.media', {
            type: 'MEDIA_STATE',
            roomId,
            from: selfIdRef.current,
            media: { video: isVideoOn, audio: isAudioOn, sharing: isSharing }
          })

          // gửi offer tới người đã có
          for (const p of msg.participants || []) {
            if (p.id !== selfIdRef.current) await makeInitialOfferTo(p.id)
          }
          return
        }

        if (msg.type === 'OFFER') {
          const from = msg.from
          const holder = getOrCreatePeer(from)
          const { pc, makingOfferRef, setIgnoreOffer } = holder
          const polite = String(selfIdRef.current || '') < String(from || '')
          const offer = new RTCSessionDescription(msg.sdp)
          const offerCollision = makingOfferRef() || pc.signalingState !== 'stable'
          try {
            if (offerCollision) {
              if (!polite) {
                setIgnoreOffer(true)
                return
              }
              await pc.setLocalDescription({ type: 'rollback' })
            }
            setIgnoreOffer(false)
            await pc.setRemoteDescription(offer)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            publishSafe('/app/webrtc.answer', { type: 'ANSWER', to: from, sdp: answer })
          } catch (e) {
            console.warn('handle OFFER error', e)
          }
          return
        }

        if (msg.type === 'ANSWER') {
          const from = msg.from
          const p = peersRef.current.get(from)
          if (!p) return
          if (p.pc.signalingState !== 'have-local-offer') {
            console.warn('[SIG] Ignore ANSWER, state=', p.pc.signalingState)
            return
          }
          try {
            await p.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          } catch (e) {
            console.warn('handle ANSWER error', e)
          }
          return
        }

        if (msg.type === 'ICE') {
          const from = msg.from
          const holder = peersRef.current.get(from) || getOrCreatePeer(from)
          if (holder.ignoreOfferRef && holder.ignoreOfferRef()) return
          try {
            await holder.pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
          } catch (e) {
            console.warn('addIceCandidate error', e)
          }
          return
        }
      })

      // Room topic
      c.subscribe(`/topic/rooms/${roomId}`, async (frame) => {
        const msg = JSON.parse(frame.body)

        if (msg.type === 'PARTICIPANTS') {
          setParticipants(msg.participants || [])
          for (const p of (msg.participants || [])) {
            if (p.id !== selfIdRef.current && !peersRef.current.get(p.id)) {
              await makeInitialOfferTo(p.id)
            }
          }
          return
        }

        if (msg.type === 'LEAVE') {
          const leftId = msg.from
          try { peersRef.current.get(leftId)?.pc.close() } catch {}
          peersRef.current.delete(leftId)
          setRemoteStreams(prev => {
            const clone = { ...prev }
            delete clone[leftId]
            return clone
          })
          return
        }

        if (msg.type === 'CHAT') {
          setChats(prev => [...prev, { from: msg.username || msg.from || '??', content: msg.content || '' }])
          return
        }

        if (msg.type === 'MEDIA_STATE') {
          updateParticipantMedia(msg.from, msg.media || {})
          return
        }
      })

      const name = username || localStorage.getItem('displayName') || 'guest'
      publishSafe('/app/webrtc.join', { type: 'JOIN', roomId, username: name })
    }

    c.onStompError = (f) => console.error('[STOMP ERROR]', f.headers['message'], f.body)
    c.onWebSocketClose = () => console.warn('[STOMP] websocket closed')
    c.onDisconnect = () => console.log('[STOMP] disconnected')

    c.activate()

    const clean = () => {
      stopShareScreenInternal().catch(() => {})
      for (const [, { pc }] of peersRef.current.entries()) {
        try { pc.close() } catch {}
      }
      peersRef.current.clear()
      try { clientRef.current?.deactivate() } catch {}
      clientRef.current = null
    }
    window.addEventListener('beforeunload', clean)
    return () => { window.removeEventListener('beforeunload', clean); clean() }
  }, [roomId, username, mediaReady, isVideoOn, isAudioOn, isSharing])

  // ===== chat =====
  const [input, setInput] = useState('')
  const sendChat = () => {
    if (!input.trim()) return
    publishSafe('/app/meet.chat.send', { type: 'CHAT', roomId, content: input.trim(), username })
    setInput('')
  }

  // ===== actions =====
  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href)
    alert('Đã copy link phòng!')
  }

  const broadcastMedia = (extra = {}) => {
    publishSafe('/app/meet.media', {
      type: 'MEDIA_STATE',
      roomId,
      from: selfIdRef.current,
      media: { video: isVideoOn, audio: isAudioOn, sharing: isSharing, ...extra }
    })
  }

  const toggleVideo = async () => {
    const on = !isVideoOn
    setIsVideoOn(on)
    localStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = on))
    broadcastMedia({ video: on })
  }

  const toggleAudio = async () => {
    const on = !isAudioOn
    setIsAudioOn(on)
    localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = on))
    broadcastMedia({ audio: on })
  }

  const stopShareScreenInternal = async () => {
    if (!isSharing) return
    const cam = localStreamRef.current?.getVideoTracks()[0]
    if (cam) {
      peersRef.current.forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) sender.replaceTrack(cam)
      })
    }
    const scr = screenStreamRef.current
    scr?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    if (shareVideoRef.current) shareVideoRef.current.srcObject = null
    setIsSharing(false)
    broadcastMedia({ sharing: false })
  }

  const shareScreenToggle = async () => {
    if (!isSharing) {
      try {
        const scr = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = scr
        const track = scr.getVideoTracks()[0]
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video')
          if (sender) sender.replaceTrack(track)
        })
        setIsSharing(true)
        if (shareVideoRef.current) {
          shareVideoRef.current.srcObject = scr
          try { await shareVideoRef.current.play() } catch {}
        }
        broadcastMedia({ sharing: true })
        track.onended = () => { stopShareScreenInternal().catch(() => {}) }
      } catch (e) {
        console.warn('shareScreen error', e)
      }
    } else {
      await stopShareScreenInternal()
    }
  }

  // ===== UI helpers =====
  const getLabel = (id) => {
    const p = participants.find(x => x.id === id)
    if (!p) return id
    const media = p.media || {}
    const cam = media.video !== false
    const mic = media.audio !== false
    const sh = media.sharing === true
    return `${p.username || id}${sh ? ' 🖥' : ''}${cam ? '' : ' 🔒cam'}${mic ? '' : ' 🔇mic'}`
  }

  const remoteTiles = Object.entries(remoteStreams).map(([id, ms]) => (
    <RemoteTile key={id} stream={ms} label={getLabel(id)} />
  ))

  // ===== render =====
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Video area */}
      <div className="lg:col-span-2 relative">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold">Room: <code>{roomId}</code></div>
            <div className="text-xs text-gray-500">Participants: {participants.length}</div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton title="Copy link" onClick={copyInvite}>
              <FiCopy className="w-4 h-4" />
            </IconButton>

            <IconButton
              title={isSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
              onClick={shareScreenToggle}
              active={isSharing}
            >
              {isSharing ? <FiSquare className="w-4 h-4" /> : <FiMonitor className="w-4 h-4" />}
            </IconButton>

            <IconButton
              title={isVideoOn ? 'Tắt video' : 'Bật video'}
              onClick={toggleVideo}
              active={isVideoOn}
            >
              {isVideoOn ? <FiVideo className="w-4 h-4" /> : <FiVideoOff className="w-4 h-4" />}
            </IconButton>

            <IconButton
              title={isAudioOn ? 'Tắt mic' : 'Bật mic'}
              onClick={toggleAudio}
              active={isAudioOn}
            >
              {isAudioOn ? <FiMic className="w-4 h-4" /> : <FiMicOff className="w-4 h-4" />}
            </IconButton>
          </div>
        </div>

        <div className="relative w-full h-full overflow-hidden">
          {isSharing && (
            <video
              ref={shareVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {!isSharing && (
            <div
              className="grid gap-2 p-2"
              style={{
                gridTemplateColumns:
                  remoteTiles.length <= 1 ? '1fr' :
                  remoteTiles.length === 2 ? '1fr 1fr' :
                  remoteTiles.length <= 4 ? '1fr 1fr' : '1fr 1fr 1fr'
              }}
            >
              {remoteTiles.length ? remoteTiles : (
                <div className="flex items-center justify-center text-gray-400">
                  Waiting for others to join…
                </div>
              )}
            </div>
          )}

          {/* PiP self */}
          <div className="absolute bottom-3 right-3 w-44 h-28 rounded-lg overflow-hidden shadow-lg ring-1 ring-black/10 bg-black">
            <video ref={selfPreviewRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Right: Chat */}
      <div className="card h-[520px] flex flex-col">
        <div className="p-3 border-b font-semibold">Live Chat</div>
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
          {chats.map((c, i) => (
            <div key={i} className="mb-2">
              <b>{c.from}</b>: <span>{c.content}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex gap-2">
          <input
            className="input input-bordered flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Nhập tin nhắn..."
          />
          <button className="btn btn-primary" onClick={sendChat}>Gửi</button>
        </div>
      </div>
    </div>
  )
}

function RemoteTile({ stream, label }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream
      ref.current.play().catch(() => {})
    }
  }, [stream])
  return (
    <div className="relative rounded-lg overflow-hidden bg-black">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
        {label}
      </div>
    </div>
  )
}

function IconButton({ children, onClick, title, active }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center w-9 h-9 rounded-lg border transition',
        active
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      ].join(' ')}
      aria-pressed={active ? 'true' : 'false'}
    >
      {children}
    </button>
  )
}

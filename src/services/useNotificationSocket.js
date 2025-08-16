import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';

export default function useNotificationSocket({ userId, onMessage }) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // URL BE: config qua env. Nếu không set, fallback localhost:8080
    const BASE = import.meta?.env?.VITE_API_BASE?.replace(/\/+$/, '') || 'http://localhost:8080';
    const wsUrl = `${BASE}/ws`;

    console.log('[WS] init for user', userId, '->', wsUrl);

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 3000,
      debug: (str) => console.log('[STOMP]', str),
      onConnect: () => {
        console.log('[WS] connected');
     
        const sub = client.subscribe(`/topic/user.${userId}`, (frame) => {
          try {
            const body = frame.body || '';
            let n;
            try {
              n = JSON.parse(body);
            } catch {
              // fallback nếu BE không trả JSON thuần
              n = { title: 'Thông báo', body };
            }

            const title = n.title || 'Thông báo mới';
            const msg   = n.body ? ` – ${n.body}` : '';
            toast.success(`${title}${msg}`, { autoClose: 3500 });
            onMessage?.(n);
          } catch (e) {
            console.error('Parse notification error:', e);
          
          }
        });

        // lưu subscription nếu cần hủy riêng (ở đây không bắt buộc)
        clientRef.current._userSub = sub;
      },
      onStompError: (f) => {
        console.error('[WS] STOMP error', f);
      
      },
      onWebSocketError: (e) => {
        console.error('[WS] socket error', e);
       
      },
      onDisconnect: () => {
        console.log('[WS] disconnected');
      
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        clientRef.current?._userSub?.unsubscribe();
      } catch {}
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [userId, onMessage]);
}

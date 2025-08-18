import { useRef, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Hook STOMP cho chat realtime.
 * @param {(msg:any)=>void} onMessage callback nhận tin nhắn
 */
export default function useChatSocket(onMessage, currentUser) {
  const clientRef = useRef(null);
  const pendingSubs = useRef([]);
  const pendingTypingSubs = useRef([]);

  /* ----- connect (nếu chưa) ----- */
  const connect = () => {
    if (clientRef.current?.connected) return;

    clientRef.current = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      debug: (s) => console.log("[STOMP]", s),
      onConnect: () => {
        console.log("🟢 STOMP connected");

        // Sub room chat
        pendingSubs.current.forEach((id) => subscribe(id));
        pendingSubs.current = [];

        // Sub room typing
        pendingTypingSubs.current.forEach(({ chatId, onTyping }) =>
          subscribeTyping(chatId, onTyping)
        );
        pendingTypingSubs.current = [];
      },
      onStompError: (f) => console.error("🔴 STOMP error", f),
    });

    clientRef.current.onWebSocketError = (e) =>
      console.error("🔴 WebSocket error", e);

    clientRef.current.activate();
  };

  /* ----- subscribe message ----- */
  const subscribe = (chatId) => {
    if (!clientRef.current?.connected) {
      pendingSubs.current.push(chatId);
      return null;
    }
    return clientRef.current.subscribe(`/topic/chat/${chatId}`, (frame) => {
      onMessage?.(JSON.parse(frame.body));
    });
  };

  /* ----- subscribe typing ----- */
  const subscribeTyping = (chatId, onTyping) => {
    if (!clientRef.current?.connected) {
      pendingTypingSubs.current.push({ chatId, onTyping });
      return null;
    }

    console.log("🟢 Subscribing to /topic/chat/" + chatId + "/typing");

   return clientRef.current.subscribe(`/topic/chat/${chatId}/typing`, (frame) => {
  const senderId = frame.body;
  console.log("🔥 Received TYPING from:", senderId);
  onTyping?.(senderId);
});

  };

  /* ----- send message/typing ----- */
  const send = (payload, destination = "/app/chat.send") => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination,
      body: JSON.stringify(payload),
    });
  };

  /* ----- disconnect ----- */
  const disconnect = () => clientRef.current?.deactivate();

const unsubscribe = (subscription) => {
  try {
    subscription?.unsubscribe?.();
    console.log("🟡 Unsubscribed message room");
  } catch (e) {
    console.error("Unsubscribe error:", e);
  }
};
const unsubscribeTyping = (subscription) => {
  try {
    subscription?.unsubscribe?.();
    console.log("🟡 Unsubscribed typing room");
  } catch (e) {
    console.error("Unsubscribe typing error:", e);
  }
};

  /* ----- auto connect on mount ----- */
   useEffect(() => {
    connect();
    return disconnect;
  }, [currentUser?.id]);

  return { connect, subscribe, subscribeTyping, send, disconnect , unsubscribe, unsubscribeTyping};
}

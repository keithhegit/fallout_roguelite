import { useEffect, useState } from 'react';
import PartySocket from 'partysocket';

// Smartly detect PartyKit server address
// Dev: Use current hostname + 1999 port (supports localhost and IP access)
// Prod: Use env var or default remote server
const getPartyKitHost = () => {
  if (import.meta.env.DEV) {
    // Dev: Use current page hostname to support IP access
    const hostname = window.location.hostname;
    return `${hostname}:1999`;
  } else {
    // Prod: Use configured remote server
    return import.meta.env.VITE_PARTYKIT_HOST;
  }
};

const PARTYKIT_HOST = getPartyKitHost();

// Global state management
let globalSocket: PartySocket | null = null;
let messageListeners: ((data: any) => void)[] = [];
let onlineCountListeners: ((count: number) => void)[] = [];
let currentOnlineCount = 0;

function setupGlobalConnection(roomName: string) {
  if (!PARTYKIT_HOST) return null;
  if (globalSocket) return globalSocket;

  const s = new PartySocket({
    host: PARTYKIT_HOST,
    room: roomName,
  });

  s.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle online count update
      if (data.type === 'onlineCountUpdate') {
        currentOnlineCount = data.onlineCount;
        onlineCountListeners.forEach((listener) =>
          listener(currentOnlineCount)
        );
      } else if (data.type === 'welcome') {
        // Welcome message contains initial online count
        currentOnlineCount = data.onlineCount || 0;
        onlineCountListeners.forEach((listener) =>
          listener(currentOnlineCount)
        );

        // Trigger message listeners as well
        messageListeners.forEach((listener) => listener(data));
      } else {
        // Normal message
        messageListeners.forEach((listener) => listener(data));
      }
    } catch (e) {
      // Non-JSON message
      messageListeners.forEach((listener) => listener(event.data));
    }
  };

  globalSocket = s;
  return s;
}

export function useParty(roomName: string = 'main', limit: number = 150) {
  const [socket, setSocket] = useState<PartySocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    const s = setupGlobalConnection(roomName);
    if (!s) {
      setSocket(null);
      setOnlineCount(0);
      return;
    }
    setSocket(s);

    // Add message listener
    const messageListener = (data: any) => {
      setMessages((prev) => {
        const newMessages = [...prev, data];
        return newMessages.slice(-limit);
      });
    };

    // Add online count listener
    const onlineCountListener = (count: number) => {
      setOnlineCount(count);
    };

    messageListeners.push(messageListener);
    onlineCountListeners.push(onlineCountListener);

    // Set initial online count
    setOnlineCount(currentOnlineCount);

    return () => {
      // 清理监听器
      messageListeners = messageListeners.filter((l) => l !== messageListener);
      onlineCountListeners = onlineCountListeners.filter(
        (l) => l !== onlineCountListener
      );

      // 如果没有监听器了，关闭连接
      if (
        messageListeners.length === 0 &&
        onlineCountListeners.length === 0 &&
        globalSocket
      ) {
        globalSocket.close();
        globalSocket = null;
        currentOnlineCount = 0;
      }
    };
  }, [roomName, limit]);

  const sendMessage = (message: any) => {
    if (socket) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, messages, sendMessage, onlineCount };
}

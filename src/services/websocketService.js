class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.reconnectTimer = null;
    this.eventListeners = {};
    this.url = '';
    this.isConnecting = false;
  }

  connect(queueId) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem('smartqueue_token');
    if (!token) return;

    this.isConnecting = true;
    this.triggerEvent('status', 'Connecting...');

    // Base API URL logic
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    this.url = `${wsBaseUrl}/ws/queue/${queueId}?token=${token}`;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.triggerEvent('status', 'Live');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.triggerEvent('message', data);
        if (data.type) {
          this.triggerEvent(data.type, data);
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
      this.triggerEvent('status', 'Offline');
      this.scheduleReconnect(queueId);
    };

    this.ws.onerror = (error) => {
      this.isConnecting = false;
      console.error('WebSocket error:', error);
      // Let onclose handle reconnect
    };
  }

  scheduleReconnect(queueId) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    // 1s, 2s, 4s, 8s... max 10s
    let delay = Math.pow(2, this.reconnectAttempts) * 1000;
    if (delay > this.maxReconnectDelay) delay = this.maxReconnectDelay;
    
    this.triggerEvent('status', 'Reconnecting...');
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(queueId);
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.eventListeners = {};
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }
}

export const wsService = new WebSocketService();

import { getToken } from './client';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageHandlers = new Set();
  }

  connect() {
    const token = getToken();
    if (!token) {
      console.error('No token found, cannot connect to WebSocket');
      return;
    }

    const wsUrl = import.meta.env.PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'auth_success') {
          console.log('✅ WebSocket authenticated');
        } else if (data.type === 'auth_error') {
          console.error('❌ WebSocket auth failed');
          this.disconnect();
        } else {
          // Notify all registered handlers
          this.messageHandlers.forEach(handler => handler(data));
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Register a message handler
  onMessage(handler) {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  // Send a message
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

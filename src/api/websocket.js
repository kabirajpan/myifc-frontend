import { getToken } from './client';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.messageHandlers = new Set();
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.pendingMessages = [];
  }

  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket already connecting or connected');
      return;
    }

    const token = getToken();
    if (!token) {
      console.error('❌ No token found, cannot connect to WebSocket');
      return;
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.isAuthenticated = false;

      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Authenticate
      this.send({
        type: 'auth',
        token: token
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'auth_success') {
          console.log('✅ WebSocket authenticated');
          this.isAuthenticated = true;
          
          // Send any pending messages
          this.flushPendingMessages();
        } else if (data.type === 'auth_error') {
          console.error('❌ WebSocket auth failed:', data.message);
          this.disconnect();
        } else {
          // Notify all registered handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (err) {
              console.error('Error in message handler:', err);
            }
          });
        }
      } catch (err) {
        console.error('❌ WebSocket message parse error:', err);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected', event.code, event.reason);
      this.isConnecting = false;
      this.isAuthenticated = false;
      this.ws = null;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnecting = false;
    };
  }

  attemptReconnect() {
    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Reconnecting... attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.');
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket');
    
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.pendingMessages = [];
  }

  // Register a message handler
  onMessage(handler) {
    this.messageHandlers.add(handler);
    console.log('📝 Message handler registered. Total handlers:', this.messageHandlers.size);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
      console.log('🗑️ Message handler removed. Total handlers:', this.messageHandlers.size);
    };
  }

  // Send a message (with queue for unauthenticated state)
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated) {
      this.ws.send(JSON.stringify(data));
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isAuthenticated) {
      // Queue messages while authenticating (except auth message itself)
      if (data.type !== 'auth') {
        console.log('⏳ Queueing message (not authenticated yet)');
        this.pendingMessages.push(data);
      } else {
        this.ws.send(JSON.stringify(data));
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  // Flush pending messages after authentication
  flushPendingMessages() {
    if (this.pendingMessages.length > 0) {
      console.log(`📤 Sending ${this.pendingMessages.length} pending messages`);
      this.pendingMessages.forEach(msg => this.send(msg));
      this.pendingMessages = [];
    }
  }

  // Check connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  // Get current state
  getState() {
    if (!this.ws) return 'DISCONNECTED';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return this.isAuthenticated ? 'CONNECTED' : 'AUTHENTICATING';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
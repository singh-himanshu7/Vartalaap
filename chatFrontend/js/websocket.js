/**
 * Vartalaap WebSocket & STOMP Client Manager
 */

let stompClient = null;
let currentSubscription = null;

// Backend base URL detection (Supports local server or served statically by Spring Boot)
function getBackendUrl() {
    // If opening index.html via file:// or Live Server on 5500/3000, default to Spring Boot port 8080
    if (window.location.protocol === 'file:' || window.location.port !== '8080') {
        return 'http://localhost:8080';
    }
    return window.location.origin;
}

/**
 * Connect to Spring Boot WebSocket STOMP endpoint
 * @param {string} roomId - ID of the room to join & subscribe
 * @param {function} onMessageReceived - Callback when a new message arrives from broadcast
 * @param {function} onStatusChange - Callback to update connection status in UI
 */
function connectWebSocket(roomId, onMessageReceived, onStatusChange) {
    if (!roomId) return;

    onStatusChange('CONNECTING');

    const backendUrl = getBackendUrl();
    const socket = new SockJS(`${backendUrl}/chat`);
    stompClient = Stomp.over(socket);

    // Disable verbose debug logging in console unless needed
    stompClient.debug = null;

    stompClient.connect({}, function (frame) {
        onStatusChange('CONNECTED');
        
        // Subscribe to real-time room messages topic
        currentSubscription = stompClient.subscribe(`/topic/room/${roomId}`, function (messageOutput) {
            try {
                const message = JSON.parse(messageOutput.body);
                onMessageReceived(message);
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        });
    }, function (error) {
        console.error("STOMP connection error:", error);
        onStatusChange('DISCONNECTED');
        showToast("WebSocket connection lost. Attempting reconnect...", "error");
        
        // Auto-reconnect after 3 seconds if disconnected unexpectedly
        setTimeout(() => {
            if (window.currentRoomId) {
                connectWebSocket(roomId, onMessageReceived, onStatusChange);
            }
        }, 3000);
    });
}

/**
 * Send a message via WebSocket STOMP mapping
 * @param {string} roomId 
 * @param {string} sender 
 * @param {string} content 
 */
function sendStompMessage(roomId, sender, content) {
    if (!stompClient || !stompClient.connected) {
        showToast("Not connected to chat server!", "error");
        return false;
    }

    if (!content || content.trim() === '') return false;

    const messagePayload = {
        content: content.trim(),
        sender: sender,
        roomID: roomId
    };

    stompClient.send(`/app/sendMessage/${roomId}`, {}, JSON.stringify(messagePayload));
    return true;
}

/**
 * Cleanly disconnect WebSocket connection
 */
function disconnectWebSocket() {
    if (currentSubscription) {
        currentSubscription.unsubscribe();
        currentSubscription = null;
    }
    if (stompClient) {
        stompClient.disconnect(function () {
            console.log("WebSocket Disconnected");
        });
        stompClient = null;
    }
}

# Vartalaap - Standalone Chat Frontend

This is the independent **HTML, CSS, and Vanilla JavaScript** frontend for **Vartalaap** real-time chat.

## 📁 Directory Structure

```
chatFrontend/
├── index.html       # Main HTML UI (Room join/create modal & chat interface)
├── css/
│   └── style.css    # Design system, glassmorphism UI, chat bubbles
├── js/
│   ├── websocket.js # SockJS & STOMP client (connects to http://localhost:8080/chat)
│   └── app.js       # REST API integration & DOM event handling
└── README.md
```

## 🚀 How to Run Frontend & Backend Separately

### Step 1: Start Backend (`chatBackend`)
1. Ensure MongoDB is running locally on port `27017`.
2. Start the Spring Boot application on port `8080`:
   ```cmd
   .\mvnw.cmd spring-boot:run
   ```

### Step 2: Launch Standalone Frontend (`chatFrontend`)
You can launch `chatFrontend` using any of the following options:

* **Option A: VSCode Live Server (Recommended)**
  Right-click `chatFrontend/index.html` in VSCode and select **"Open with Live Server"** (runs on `http://127.0.0.1:5500` or `http://localhost:5500`).

* **Option B: Open `index.html` directly in browser**
  Double click `chatFrontend/index.html` to open it directly in Chrome, Edge, or Firefox.

* **Option C: Use Node `serve` or Python Server**
  ```bash
  # Node.js
  npx serve chatFrontend -p 5500

  # Python
  cd chatFrontend && python -m http.server 5500
  ```

## 🔗 How Integration Works
- The frontend automatically detects the backend URL:
  - If running standalone on port `5500` or via `file://`, it connects to `http://localhost:8080` for WebSockets (`/chat`) and REST APIs (`/api/v1/room`).
  - Cross-Origin Resource Sharing (CORS) is enabled on the backend in `WebSocketConfig.java` (`setAllowedOriginPatterns("*")`) and `RoomController.java` (`@CrossOrigin("*")`).

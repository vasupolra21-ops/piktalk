# LinkChat - Modern Real-time Anonymous Chat

LinkChat is a sleek, private, and anonymous real-time chatting platform. Generate a unique room link, share it with a friend, and start chatting instantly with no registration and no logs.

## Features
- **Modern UI**: Dark theme with Glassmorphism, smooth animations, and responsive design.
- **Real-time Messaging**: Powered by Socket.IO for instant communication.
- **Privacy First**: Anonymous nicknames, unique room IDs, and no message persistence.
- **Interactive**: Typing indicators, sound notifications, and emoji support.
- **Mobile Friendly**: Works perfectly on smartphones and tablets.

## Tech Stack
- **Backend**: Node.js, Express
- **Real-time**: Socket.IO
- **Frontend**: HTML5, Vanilla CSS, JavaScript
- **Icons**: FontAwesome
- **Fonts**: Google Fonts (Outfit)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
Visit `http://localhost:3000` to create your first chat room.

## Project Structure
- `server.js`: Express server and Socket.IO logic.
- `public/`: Frontend assets.
  - `index.html`: Main UI structure.
  - `style.css`: Modern styling and animations.
  - `app.js`: Client-side Socket.IO and UI logic.
- `package.json`: Project dependencies and scripts.

## License
MIT

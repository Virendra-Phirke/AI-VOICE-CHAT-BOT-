# 🤖 AI Voice Assistant

A modern web-based AI voice assistant powered by Google Gemini API with text-to-speech capabilities.

## Features

- 💬 **Real-time Chat Interface**: Beautiful, responsive chat UI
- 🎤 **Voice Output**: Text-to-speech using browser's speech synthesis
- 🧠 **AI Powered**: Powered by Google Gemini 1.5 Flash model
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⌨️ **Keyboard Shortcuts**: Quick access to common functions
- 🔄 **Session Management**: Maintains conversation context

## Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node server.js
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Basic Interaction

1. **Type your message** in the input field
2. **Press Enter** or click the Send button
3. **Listen** to the AI response (voice is enabled by default)
4. **Continue the conversation** naturally

### Controls

- **Voice Toggle**: Click the 🔊 button to turn voice on/off
- **Clear Chat**: Click the 🗑️ button to clear conversation history
- **Send Message**: Press Enter or click the Send button

### Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus on input field
- `Ctrl/Cmd + L`: Clear chat history
- `Ctrl/Cmd + M`: Toggle voice on/off

## File Structure

```
AI VOICE ASSISTANCE/
├── index.html          # Main HTML interface
├── styles.css          # CSS styling
├── web-version.js      # Frontend JavaScript
├── server.js           # Backend Express server
├── index.js            # Original Node.js version
├── package.json        # Dependencies
└── README.md           # This file
```

## API Configuration

The application uses your Gemini API key. Make sure it's properly configured in:
- `server.js` (line 12)
- `web-version.js` (line 4)

## Features in Detail

### Voice Synthesis
- Uses browser's built-in speech synthesis
- Automatically selects the best available voice
- Can be toggled on/off
- Supports multiple languages (based on available voices)

### Chat Interface
- Real-time message display
- User and AI messages are visually distinct
- Auto-scroll to latest messages
- Responsive design for all screen sizes

### AI Capabilities
- Powered by Google Gemini 1.5 Flash
- Maintains conversation context
- Handles various types of queries
- Fast response times

## Troubleshooting

### Common Issues

1. **Voice not working**:
   - Check if your browser supports speech synthesis
   - Try refreshing the page
   - Check browser permissions

2. **API errors**:
   - Verify your Gemini API key is correct
   - Check your internet connection
   - Ensure the server is running

3. **Server won't start**:
   - Check if port 3000 is available
   - Verify all dependencies are installed
   - Check Node.js version

### Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

## Development

### Running in Development Mode

1. Start the server:
   ```bash
   node server.js
   ```

2. The server will run on `http://localhost:3000`

3. Any changes to HTML/CSS/JS files will be reflected immediately

### Customization

- **Styling**: Modify `styles.css` for visual changes
- **Functionality**: Edit `web-version.js` for frontend logic
- **API**: Modify `server.js` for backend changes

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please check the troubleshooting section above or create an issue in the project repository. 
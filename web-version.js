// Web version of the AI Voice Assistant
class AIVoiceAssistant {
    constructor() {
        this.geminiApiKey = "API_KEY";
        this.voiceEnabled = true;
        this.chatHistory = [];
        this.isProcessing = false;
        this.isRecording = false;
        this.recognition = null;
        this.recognitionRetryCount = 0;
        this.maxRetries = 3;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.updateStatus('Ready');
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.voiceInputButton = document.getElementById('voiceInputButton');
        this.voiceToggle = document.getElementById('voiceToggle');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.clearChat = document.getElementById('clearChat');
        this.statusIndicator = document.getElementById('statusIndicator');
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.voiceInputButton.addEventListener('click', () => this.toggleVoiceInput());
        this.voiceToggle.addEventListener('click', () => this.toggleVoice());
        this.voiceSelect.addEventListener('change', () => this.onVoiceChange());
        this.clearChat.addEventListener('click', () => this.clearChatHistory());
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isProcessing) return;

        // Stop any ongoing speech immediately when a new message is sent
        this.stopSpeech();

        this.isProcessing = true;
        this.userInput.value = '';
        this.updateStatus('Thinking...', 'thinking');

        // Add user message to chat
        this.addMessage(message, 'user');

        // Show loading indicator
        this.addTypingIndicator();

        try {
            // Call Gemini API
            const response = await this.callGeminiAPI(message);
            
            // Remove loading indicator
            this.removeTypingIndicator();
            
            // Add AI response to chat
            this.addMessage(response, 'assistant');
            
            // Speak the response if voice is enabled
            if (this.voiceEnabled) {
                this.speakText(response);
            }

            this.updateStatus('Ready');
        } catch (error) {
            console.error('Error:', error);
            // Remove loading indicator on error
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            this.updateStatus('Error', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    async callGeminiAPI(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId || 'default'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data.response;
        } catch (error) {
            console.error('Error calling API:', error);
            throw error;
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Add to chat history
        this.chatHistory.push({ content, type, timestamp: new Date() });
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            // Remove asterisks for speech output
            let cleanText = text.replace(/\*/g, '');
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // More natural speech settings
            utterance.rate = 0.85;        // Slightly slower for more natural pace
            utterance.pitch = 1.1;        // Slightly higher pitch for warmth
            utterance.volume = 0.9;       // Slightly lower volume for realism
            
            // Get selected voice or auto-select
            const voices = speechSynthesis.getVoices();
            let selectedVoice = null;
            
            if (this.selectedVoiceName && this.selectedVoiceName !== '') {
                // Use user-selected voice
                selectedVoice = voices.find(voice => voice.name === this.selectedVoiceName);
            }
            
            if (!selectedVoice) {
                // Auto-select the best available voice
                const preferredVoices = [
                    // Google voices (usually high quality)
                    voice => voice.name.includes('Google') && voice.lang.includes('en'),
                    // Microsoft voices (often very natural)
                    voice => voice.name.includes('Microsoft') && voice.lang.includes('en'),
                    // Siri voices (if available)
                    voice => voice.name.includes('Siri') && voice.lang.includes('en'),
                    // Any English voice with "natural" in the name
                    voice => voice.name.toLowerCase().includes('natural') && voice.lang.includes('en'),
                    // Any English voice with "premium" in the name
                    voice => voice.name.toLowerCase().includes('premium') && voice.lang.includes('en'),
                    // Any English voice
                    voice => voice.lang.includes('en'),
                    // Fallback to any available voice
                    voice => true
                ];
                
                for (const voiceFilter of preferredVoices) {
                    selectedVoice = voices.find(voiceFilter);
                    if (selectedVoice) break;
                }
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log('Using voice:', selectedVoice.name);
            }
            
            // Process text for more natural speech
            let processedText = cleanText;
            
            // Add natural pauses and breathing
            processedText = processedText
                .replace(/\./g, '... ')           // Longer pause after sentences
                .replace(/\!/g, '!... ')          // Pause after exclamations
                .replace(/\?/g, '?... ')          // Pause after questions
                .replace(/\,/g, ',.. ')           // Short pause after commas
                .replace(/\:/g, ':.. ')           // Pause after colons
                .replace(/\;/g, ';.. ')           // Pause after semicolons
                .replace(/\n/g, '... ')           // Pause for line breaks
                .replace(/\s+/g, ' ')             // Normalize whitespace
                .trim();
            
            // Add breathing pauses for longer sentences
            const sentences = processedText.split('...');
            if (sentences.length > 3) {
                processedText = sentences.map((sentence, index) => {
                    if (index > 0 && index % 3 === 0) {
                        return sentence + '... '; // Extra pause every 3 sentences
                    }
                    return sentence;
                }).join('... ');
            }
            
            utterance.text = processedText;
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Speech synthesis not supported');
        }
    }

    stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            console.log('Speech stopped');
        }
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        const btnText = this.voiceToggle.querySelector('.btn-text');
        const btnIcon = this.voiceToggle.querySelector('.btn-icon');
        
        if (this.voiceEnabled) {
            btnText.textContent = 'Voice: ON';
            btnIcon.textContent = '🔊';
            this.voiceToggle.classList.add('active');
        } else {
            btnText.textContent = 'Voice: OFF';
            btnIcon.textContent = '🔇';
            this.voiceToggle.classList.remove('active');
            // Stop any ongoing speech
            this.stopSpeech();
        }
    }

    clearChatHistory() {
        // Stop any ongoing speech when chat is cleared
        this.stopSpeech();
        
        // Remove any loading indicator
        this.removeTypingIndicator();
        
        this.chatMessages.innerHTML = `
            <div class="message system">
                <div class="message-content">
                    Chat history cleared. How can I help you?
                </div>
            </div>
        `;
        this.chatHistory = [];
    }

    populateVoiceSelect() {
        const voices = speechSynthesis.getVoices();
        this.voiceSelect.innerHTML = '<option value="">Auto-select best voice</option>';
        
        // Group voices by language
        const voiceGroups = {};
        voices.forEach(voice => {
            const lang = voice.lang.split('-')[0];
            if (!voiceGroups[lang]) {
                voiceGroups[lang] = [];
            }
            voiceGroups[lang].push(voice);
        });
        
        // Add voices to select, prioritizing English
        const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
        
        languages.forEach(lang => {
            if (voiceGroups[lang]) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = this.getLanguageName(lang);
                
                voiceGroups[lang].forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = voice.name;
                    optgroup.appendChild(option);
                });
                
                this.voiceSelect.appendChild(optgroup);
            }
        });
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese'
        };
        return languages[code] || code;
    }

    onVoiceChange() {
        this.selectedVoiceName = this.voiceSelect.value;
        if (this.selectedVoiceName) {
            console.log('Selected voice:', this.selectedVoiceName);
        }
    }

    initializeSpeechRecognition() {
        // Check if speech recognition is supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition settings with better defaults
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            // Set up event handlers
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.voiceInputButton.classList.add('recording');
                this.updateStatus('Listening...', 'thinking');
                console.log('Voice recognition started');
                
                // Temporarily disable voice output during voice input
                this.voiceEnabledDuringInput = this.voiceEnabled;
                this.voiceEnabled = false;
                
                // Update voice toggle button to show it's temporarily disabled
                if (this.voiceEnabledDuringInput) {
                    this.voiceToggle.classList.add('temporarily-disabled');
                }
                
                // Add visual feedback
                this.addMessage('🎤 Listening... Speak now!', 'system');
            };
            
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Update input field with interim results
                if (interimTranscript) {
                    this.userInput.value = finalTranscript + interimTranscript;
                }
                
                // If we have final results, send the message
                if (finalTranscript) {
                    this.userInput.value = finalTranscript;
                    this.stopVoiceInput();
                    // Remove the listening message
                    this.removeLastSystemMessage();
                    // Reset retry count on success
                    this.recognitionRetryCount = 0;
                    // Restore voice output if it was enabled before voice input
                    if (this.voiceEnabledDuringInput) {
                        this.voiceEnabled = true;
                        this.voiceToggle.classList.remove('temporarily-disabled');
                    }
                    // The sendMessage() will handle the loading indicator
                    this.sendMessage();
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceInput();
                this.updateStatus('Voice recognition error', 'error');
                
                // Remove the listening message
                this.removeLastSystemMessage();
                
                // Restore voice output if it was enabled before voice input
                if (this.voiceEnabledDuringInput) {
                    this.voiceEnabled = true;
                    this.voiceToggle.classList.remove('temporarily-disabled');
                }
                
                // Show user-friendly error message based on error type
                let errorMessage = 'Voice recognition failed. Please try typing instead.';
                
                switch (event.error) {
                    case 'not-allowed':
                        errorMessage = '❌ Microphone access denied. Please allow microphone access in your browser settings and try again.';
                        break;
                    case 'no-speech':
                        errorMessage = '🔇 No speech detected. Please speak clearly and try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = '🎤 Audio capture failed. Please check your microphone and try again.';
                        break;
                    case 'network':
                        errorMessage = '🌐 Network error. Please check your internet connection and try again.';
                        break;
                    case 'service-not-allowed':
                        errorMessage = '🚫 Speech recognition service not allowed. Please try again later.';
                        break;
                    case 'bad-grammar':
                        errorMessage = '📝 Speech recognition grammar error. Please try again.';
                        break;
                    case 'language-not-supported':
                        errorMessage = '🌍 Language not supported. Please try English.';
                        break;
                    default:
                        errorMessage = '❌ Voice recognition failed. Please try typing instead.';
                }
                
                this.addMessage(errorMessage, 'system');
                
                // Add helpful tips
                setTimeout(() => {
                    this.addMessage('💡 Tips: Make sure your microphone is working, speak clearly, and check browser permissions.', 'system');
                }, 2000);

                // Try to retry if it's a recoverable error and we haven't exceeded max retries
                if (this.recognitionRetryCount < this.maxRetries && 
                    ['no-speech', 'audio-capture', 'network'].includes(event.error)) {
                    this.recognitionRetryCount++;
                    setTimeout(() => {
                        this.addMessage(`🔄 Retrying voice recognition (${this.recognitionRetryCount}/${this.maxRetries})...`, 'system');
                        this.startVoiceInput();
                    }, 3000);
                } else {
                    // Reset retry count
                    this.recognitionRetryCount = 0;
                    // Show error state on voice button
                    this.voiceInputButton.classList.add('error');
                    setTimeout(() => {
                        this.voiceInputButton.classList.remove('error');
                    }, 5000);
                }
            };
            
            this.recognition.onend = () => {
                this.stopVoiceInput();
                console.log('Voice recognition ended');
                
                // Remove the listening message if it's still there
                this.removeLastSystemMessage();
                
                // Restore voice output if it was enabled before voice input
                if (this.voiceEnabledDuringInput) {
                    this.voiceEnabled = true;
                    this.voiceToggle.classList.remove('temporarily-disabled');
                }
            };
            
        } else {
            console.log('Speech recognition not supported');
            this.voiceInputButton.style.display = 'none';
            this.addMessage('❌ Voice recognition is not supported in your browser. Please use typing instead.', 'system');
        }
    }

    toggleVoiceInput() {
        if (this.isRecording) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        if (this.recognition && !this.isRecording) {
            // Stop any ongoing speech when voice input starts
            this.stopSpeech();
            
            // Check microphone permissions first
            this.checkMicrophonePermission().then(() => {
                this.recognition.start();
            }).catch((error) => {
                console.error('Microphone permission error:', error);
                this.addMessage('❌ Microphone access required. Please allow microphone access and try again.', 'system');
            });
        }
    }

    // Method to check microphone permissions
    async checkMicrophonePermission() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            throw error;
        }
    }

    stopVoiceInput() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.voiceInputButton.classList.remove('recording');
            this.updateStatus('Ready');
            
            // Restore voice output if it was enabled before voice input
            if (this.voiceEnabledDuringInput) {
                this.voiceEnabled = true;
                this.voiceToggle.classList.remove('temporarily-disabled');
            }
        }
        // Also stop any ongoing speech when voice input is stopped
        this.stopSpeech();
    }

    updateStatus(text, type = 'ready') {
        const statusText = this.statusIndicator.querySelector('.status-text');
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        
        statusText.textContent = text;
        statusDot.className = `status-dot ${type}`;
    }

    // Method to add typing indicator
    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        
        this.chatMessages.appendChild(typingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Method to remove typing indicator
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Method to remove the last system message (used for cleaning up listening messages)
    removeLastSystemMessage() {
        const messages = this.chatMessages.querySelectorAll('.message.system');
        const lastSystemMessage = messages[messages.length - 1];
        
        // Only remove if it's a listening message
        if (lastSystemMessage && lastSystemMessage.textContent.includes('🎤 Listening')) {
            lastSystemMessage.remove();
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Create and initialize the AI Voice Assistant
    window.aiAssistant = new AIVoiceAssistant();
    
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
        // Populate voice selector when voices are loaded
        speechSynthesis.onvoiceschanged = () => {
            window.aiAssistant.populateVoiceSelect();
        };
        
        // If voices are already loaded, populate immediately
        if (speechSynthesis.getVoices().length > 0) {
            window.aiAssistant.populateVoiceSelect();
        }
    }
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'k':
                e.preventDefault();
                document.getElementById('userInput').focus();
                break;
            case 'l':
                e.preventDefault();
                window.aiAssistant.clearChatHistory();
                break;
            case 'm':
                e.preventDefault();
                window.aiAssistant.toggleVoice();
                break;
            case 's':
                e.preventDefault();
                window.aiAssistant.stopSpeech();
                break;
        }
    }
    
    // Voice input shortcut - Ctrl + Space
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        window.aiAssistant.toggleVoiceInput();
    }
}); 

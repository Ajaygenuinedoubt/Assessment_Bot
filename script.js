const talkButton = document.getElementById('talk-button');
const status = document.getElementById('status');
const chatContainer = document.getElementById('chat-container');
const thinkingBall = document.getElementById('thinking-ball');
const modeToggle = document.getElementById('mode-toggle');
const body = document.body;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        status.textContent = 'Listening...';
        talkButton.classList.add('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        status.textContent = `You said: "${transcript}"`;
        talkButton.classList.remove('listening');
        addMessage(transcript, 'user');
        getAIResponse(transcript);
    };

    recognition.onerror = (event) => {
        status.textContent = 'Error in recognition. Please try again.';
        talkButton.classList.remove('listening');
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        if (talkButton.classList.contains('listening')) {
            talkButton.classList.remove('listening');
            status.textContent = 'Click the button to start the interview';
        }
    };
} else {
    status.textContent = 'Sorry, your browser does not support Speech Recognition.';
    talkButton.style.display = 'none';
}

talkButton.addEventListener('click', () => {
    if (!recognition) return;
    try {
        recognition.start();
    } catch (error) {
        console.error("Could not start recognition:", error);
        status.textContent = 'Click the button to start the interview';
        talkButton.classList.remove('listening');
    }
});

// Dark/Light mode toggle
modeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');
    modeToggle.textContent = body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Add message to chat
function addMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    messageEl.textContent = text;
    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Fetch AI response
async function getAIResponse(userText) {
    thinkingBall.classList.remove('hidden');
    status.textContent = 'AI is thinking...';

    try {
        const response = await fetch('/.netlify/functions/get-ai-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userText }),
        });

        const data = await response.json();

        thinkingBall.classList.add('hidden');

        if (!response.ok || data.error) {
            const errorMessage = data.message || `API call failed with status: ${response.status}`;
            console.error('AI API Error:', errorMessage);
            status.textContent = `Error: ${errorMessage}`;
            addMessage("Sorry, I couldn't answer that.", 'ai');
            return;
        }

        // Show AI answer letter by letter
        showAIResponseAnimated(data.reply);

    } catch (error) {
        thinkingBall.classList.add('hidden');
        console.error('Error fetching AI response:', error);
        status.textContent = `Error: ${error.message}`;
        addMessage("Sorry, I had trouble connecting.", 'ai');
    }
}

// Display AI response with typing effect
function showAIResponseAnimated(text) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'ai-message');
    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    let i = 0;
    const interval = setInterval(() => {
        messageEl.textContent += text[i];
        chatContainer.scrollTop = chatContainer.scrollHeight;
        i++;
        if (i >= text.length) clearInterval(interval);
    }, 30);

    // Speak the text
    speak(text);
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
        status.textContent = 'Click the button to ask another question';
    };
    window.speechSynthesis.speak(utterance);
}

// Load voices initially
window.speechSynthesis.onvoiceschanged = () => { speechSynthesis.getVoices(); };

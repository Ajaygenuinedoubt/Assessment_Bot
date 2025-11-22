const talkButton = document.getElementById('talk-button');
const status = document.getElementById('status');

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
        getAIResponse(transcript);
    };

    recognition.onerror = (event) => {
        status.textContent = 'Error in recognition. Please try again.';
        talkButton.classList.remove('listening');
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        if (talkButton.classList.contains('listening')) { // If it ends prematurely
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


async function getAIResponse(userText) {
    status.textContent = 'Thinking...';
    try {
        const response = await fetch('/.netlify/functions/get-ai-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userText }),
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        speak(data.reply);

    } catch (error) {
        console.error('Error fetching AI response:', error);
        status.textContent = 'Sorry, I had trouble connecting. Please try again.';
    }
}

function speak(text) {
    status.textContent = 'Speaking...';
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: find a nice voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Samantha'));
    if(femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    utterance.onend = () => {
        status.textContent = 'Click the button to ask another question';
    };

    window.speechSynthesis.speak(utterance);
}

// Load voices initially
window.speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};
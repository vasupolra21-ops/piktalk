const chatHistory = [
    { nickname: 'cc', message: 'hii bro', isSentByMe: false }
];

function generateAISmartReplies() {
    let lastReceived = null;
    for (let i = chatHistory.length - 1; i >= 0; i--) {
        if (!chatHistory[i].isSentByMe && chatHistory[i].message) {
            lastReceived = chatHistory[i].message.trim();
            break;
        }
    }

    let lastSent = null;
    for (let i = chatHistory.length - 1; i >= 0; i--) {
        if (chatHistory[i].isSentByMe && chatHistory[i].message) {
            lastSent = chatHistory[i].message.trim();
            break;
        }
    }

    const contextMsg = lastReceived || lastSent || '';
    const text = contextMsg.toLowerCase().trim();

    console.log('Resolved context message:', JSON.stringify(contextMsg));
    console.log('Resolved text:', JSON.stringify(text));

    const regex1 = /^\s*(hi+|hey+|hello+|hlo+|yo+|sup+|wassup|wsp|greetings|good\s*morning|good\s*evening|good\s*afternoon|namaste|howdy|hola|salut)\b/;
    const regex2 = /^(hi|hey|hello|yo|sup)\s+(bro|man|dude|buddy|guys|yaar|yar|jaan|bhai|sir|sis|there|all)/;

    console.log('Regex 1 matches:', regex1.test(text));
    console.log('Regex 2 matches:', regex2.test(text));
}

generateAISmartReplies();

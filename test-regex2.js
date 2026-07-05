function generateAISmartReplies(chatHistory) {
    if (!chatHistory || chatHistory.length === 0) {
        return ["Greetings Fallback"];
    }

    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg.isSentByMe) {
        return ["Follow-up after my own message"];
    }

    const text = (lastMsg.message || '').toLowerCase().trim();

    // ── 1. Greetings ──
    if (!text ||
        /^\s*(hi+|hey+|hello+|hlo+|yo+|sup+|wassup|wsp|greetings|good\s*morning|good\s*evening|good\s*afternoon|namaste|howdy|hola|salut)\b/.test(text) ||
        /^(hi|hey|hello|yo|sup)\s+(bro|man|dude|buddy|guys|yaar|yar|jaan|bhai|sir|sis|there|all)/.test(text)
    ) {
        return ["Greetings matched"];
    }

    // ── 2. What are you doing / wyd ──
    if (/\b(wyd|wdyd)\b/.test(text) ||
        /what.*(r u|are you|u\s+)(doing|up to|upto)/.test(text) ||
        /watcha\s*doing|what\s+u\s+doing|what\s+r\s+u\s+doing/.test(text) ||
        /kya\s*(kar\s*rahe|kr\s*rhe|chal\s*raha)/.test(text)
    ) {
        return ["Doing matched"];
    }

    // ── 3. How are you ──
    if (/how\s+(are\s+you|r\s+u|u\s+doing|have\s+you\s+been|is\s+life|is\s+everything)/.test(text) ||
        /how'?s?\s+(it\s+going|life|things|everything|\bu\b)/.test(text) ||
        /\b(you|u)\s+ok\??/.test(text) ||
        /\b(kaisa|kaise)\s*(hai|ho|hain)?\b/.test(text) ||
        /\bhow\s+are\s+(u|ya)\b/.test(text)
    ) {
        return ["How are you matched"];
    }

    return ["Default Fallback"];
}

// Test cases
console.log('Empty history:', generateAISmartReplies([]));
console.log('Last sent by me:', generateAISmartReplies([{ message: 'hi', isSentByMe: true }]));
console.log('Last received "hii bro":', generateAISmartReplies([{ message: 'hii bro', isSentByMe: false }]));
console.log('Last received "what r u doing":', generateAISmartReplies([{ message: 'what r u doing', isSentByMe: false }]));
console.log('Last received "how are you":', generateAISmartReplies([{ message: 'how are you', isSentByMe: false }]));
console.log('Last received "some random text":', generateAISmartReplies([{ message: 'some random text', isSentByMe: false }]));

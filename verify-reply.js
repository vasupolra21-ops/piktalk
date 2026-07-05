const puppeteer = require('puppeteer-core');

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 375, height: 667, isMobile: true, hasTouch: true }
        });
        
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
        
        // Create room and join
        await page.waitForSelector('#create-room-btn');
        await page.click('#create-room-btn');
        await page.waitForSelector('#confirm-create-room-btn', { visible: true });
        await page.click('#confirm-create-room-btn');
        await page.waitForSelector('#nickname-input', { visible: true });
        await page.type('#nickname-input', 'TestUser');
        await page.click('#join-chat-btn');
        await page.waitForSelector('#message-input', { visible: true });
        
        // Send a message
        await page.type('#message-input', 'Test message to reply to!');
        await page.click('#send-btn');
        await page.waitForSelector('.message', { visible: true });
        await new Promise(r => setTimeout(r, 500));

        // --- BEFORE reply: screenshot showing normal state ---
        await page.screenshot({ path: 'C:\\Users\\vasup\\.gemini\\antigravity\\brain\\e0e34317-1319-4f6e-9657-276827c46e98\\verify_before_reply.png' });
        console.log('Screenshot 1: before reply');

        // Hover and click reply
        await page.hover('.message:last-child .bubble-wrapper');
        await page.waitForSelector('button[title="Reply"]', { visible: true });
        await page.click('button[title="Reply"]');
        await new Promise(r => setTimeout(r, 800));
        
        // --- AFTER reply: screenshot showing reply bar + textarea visible ---
        await page.screenshot({ path: 'C:\\Users\\vasup\\.gemini\\antigravity\\brain\\e0e34317-1319-4f6e-9657-276827c46e98\\verify_after_reply.png' });
        console.log('Screenshot 2: after reply clicked');

        // Check DOM
        const info = await page.evaluate(() => {
            const bar = document.querySelector('.reply-preview-bar');
            const textarea = document.querySelector('#message-input');
            const inputArea = document.querySelector('.chat-input-area');
            if (!bar) return { barFound: false };
            const barRect = bar.getBoundingClientRect();
            const taRect = textarea.getBoundingClientRect();
            const iaRect = inputArea.getBoundingClientRect();
            return {
                barFound: true,
                barVisible: barRect.height > 0 && barRect.bottom > 0 && barRect.top < window.innerHeight,
                textareaVisible: taRect.height > 0 && taRect.bottom <= window.innerHeight && taRect.top >= 0,
                barRect: { top: Math.round(barRect.top), bottom: Math.round(barRect.bottom), height: Math.round(barRect.height) },
                textareaRect: { top: Math.round(taRect.top), bottom: Math.round(taRect.bottom), height: Math.round(taRect.height) },
                inputAreaRect: { top: Math.round(iaRect.top), bottom: Math.round(iaRect.bottom), height: Math.round(iaRect.height) },
                viewportHeight: window.innerHeight
            };
        });
        
        console.log('\n=== VERIFICATION RESULTS ===');
        console.log(JSON.stringify(info, null, 2));
        if (info.barFound && info.barVisible && info.textareaVisible) {
            console.log('\n✅ FIX VERIFIED: Reply bar visible AND textarea visible!');
        } else if (!info.barFound) {
            console.log('\n❌ Reply bar NOT found in DOM — click did not trigger setReply');
        } else {
            console.log('\n❌ Issue remains: bar=' + info.barVisible + ' textarea=' + info.textareaVisible);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (browser) await browser.close();
    }
})();

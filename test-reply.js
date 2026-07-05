const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    let browser;
    try {
        console.log('Launching Chrome...');
        browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ],
            defaultViewport: { width: 375, height: 350, isMobile: true, hasTouch: true }
        });
        
        const page = await browser.newPage();
        
        // Log browser console messages
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
        page.on('requestfailed', request => {
            console.log('REQUEST FAILED:', request.url(), request.failure() ? request.failure().errorText : 'unknown');
        });

        // Set navigation timeout to 60s
        await page.setDefaultNavigationTimeout(60000);
        
        console.log('Navigating to PikTalk...');
        await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
        console.log('Page loaded!');
        
        console.log('Clicking Create Room button...');
        await page.waitForSelector('#create-room-btn');
        await page.click('#create-room-btn');
        
        console.log('Waiting for Confirm Create Room button...');
        await page.waitForSelector('#confirm-create-room-btn', { visible: true });
        await page.click('#confirm-create-room-btn');
        
        console.log('Waiting for Nickname input...');
        await page.waitForSelector('#nickname-input', { visible: true });
        await page.type('#nickname-input', 'TestUser');
        await page.click('#join-chat-btn');
        
        console.log('Waiting to join chat view...');
        await page.waitForSelector('#message-input', { visible: true });
        
        console.log('Sending multiple messages to fill container...');
        for (let i = 1; i <= 20; i++) {
            await page.type('#message-input', `Test message number ${i}`);
            await page.click('#send-btn');
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.log('Waiting for last message bubble to appear...');
        await page.waitForSelector('.message:last-child', { visible: true });
        
        console.log('Hovering over message bubble wrapper...');
        await page.hover('.message:last-child .bubble-wrapper');
        
        console.log('Clicking Reply button...');
        await page.waitForSelector('button[title="Reply"]', { visible: true });
        await page.click('button[title="Reply"]');
        
        console.log('Waiting for reply bar animation...');
        await new Promise(r => setTimeout(r, 1000));
        
        const replyBarExists = await page.evaluate(() => {
            const el = document.querySelector('.reply-preview-bar');
            if (!el) return 'NOT_FOUND';
            const rect = el.getBoundingClientRect();
            const parent = el.parentElement;
            const parentRect = parent.getBoundingClientRect();
            const parentStyle = window.getComputedStyle(parent);
            return {
                className: el.className,
                rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
                parentRect: { top: parentRect.top, bottom: parentRect.bottom, height: parentRect.height },
                parentOverflow: parentStyle.overflow,
                parentDisplay: parentStyle.display,
                parentFlexDirection: parentStyle.flexDirection
            };
        });
        console.log('REPLY BAR DOM INFO:', JSON.stringify(replyBarExists, null, 2));
        
        const screenshotPath = 'C:\\Users\\vasup\\.gemini\\antigravity\\brain\\e0e34317-1319-4f6e-9657-276827c46e98\\reply_test_keyboard.png';
        console.log(`Taking screenshot: ${screenshotPath}`);
        await page.screenshot({ path: screenshotPath });
        
        console.log('Done!');
    } catch (err) {
        console.error('Error during execution:', err);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();

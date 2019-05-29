const { argv } = require('yargs');
const puppeteer = require('puppeteer');

const { watch } = require('fs-extra');
const timeOut = delay => new Promise(resolve => setTimeout(resolve, delay));
async function main(p) {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setBypassCSP(false);
    await page.setCacheEnabled(false);
    await page.goto(p.url);
    const watcher = watch(p.watch, { persistent: true, recursive: true });
    watcher.addListener('change', async () => {
        const sessionData = await page.evaluate(function () {
            const { captureSessionData } = window;
            return captureSessionData instanceof Function && captureSessionData();
        });
        await timeOut(500);
        await page.reload();
        await page.evaluate(function (sessionData) {
            const { loadCaptureSessionData } = window;
            if (loadCaptureSessionData instanceof Function)
                loadCaptureSessionData(sessionData);
        }, sessionData);
    });
}
main(argv);

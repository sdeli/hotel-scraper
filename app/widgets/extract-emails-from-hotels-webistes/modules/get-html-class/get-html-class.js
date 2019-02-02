const puppeteer = require('puppeteer');

module.exports = ((config) => {
    const {
        IS_HEADLESS
    } = config;
    
    class GetHtml {
        async init() {
            const {browser, page} = await launchPuppeterBrowser();
            this.browser = browser;
            this.page = page;
        }

        async get(link) {
            return new Promise((resolve, reject) => {
                this.page.goto(link, {waitUntil : "domcontentloaded"})
                .then(async () => {
                     let html = await this.page.content();
                     resolve(html);
                })
                .catch(err => {
                    reject(err);
                });
            });
        }

        async close() {
            await this.browser.close();
        }
    }
    
    async function launchPuppeterBrowser() {
        let launchOpts = {
            headless: IS_HEADLESS,
            ignoreHTTPSErrors : true,
        }
    
        const browser = await puppeteer.launch(launchOpts);
        const page = await browser.newPage();
        if (IS_HEADLESS) {
            page.setViewport({width: 1285, height: 644});
        }

        return {browser, page}
    }
    
    return GetHtml;
});
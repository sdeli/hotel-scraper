const puppeteer = require('puppeteer');
const {getRandomNumber} = require('widgets/scraper-utils');

module.exports = ((config) => {
    const {
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK__SEL,
        HOTEL_AVATAR_IMG__SEL
    } = config;
    
    class GoogleScraper {
        constructor(proxy) {
            this.proxy = proxy;
        }
        
        async init() {
            const {browser, page} = await launchPuppeterBrowser(this.proxy);
            this.browser = browser;
            this.page = page;
        }

        async getHotelWebsiteAndAvatar(hotelName, fullAddr, delay) {
            let queryString = `search?q=${hotelName} ${fullAddr}`.replace(/\s/g, '+');
            let url = `https://www.google.com/${queryString}`;
            let randomDelay = getRandomNumber(delay.max, delay.min);

            let hotelInfosObj = await this.delayExecution(async (resolve, reject) => {
                this.page.goto(url, {waitUntil : "domcontentloaded"})
                .then(() => {
                    return this.checkIfCurrPageIsCaptcha()
                })
                .then((isCaptcha) => {
                    if  (isCaptcha) {
                        reject(false);
                        return;
                    }
                    
                    return this.extractHotelInfos();
                })
                .then(({websiteUrl, avatarLink}) => {
                    resolve({websiteUrl, avatarLink});
                })
                .catch(err => {
                    reject(err);
                });
            }, randomDelay);

            return hotelInfosObj;
        }

        delayExecution(cb, randomDelay) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    cb(resolve, reject);
                }, randomDelay);
            });
        }

        async checkIfCurrPageIsCaptcha() {
            let isCaptcha = await this.page.url().includes('sorry');
            return isCaptcha;
        }

        async extractHotelInfos() {
            let websiteUrl = await this.page.$eval(HOTEL_WEBSITE_LINK__SEL, hotelWbsiteATag => hotelWbsiteATag.href);
            let avatarLink = await this.page.$eval(HOTEL_AVATAR_IMG__SEL, hotelAvatarImgTag => hotelAvatarImgTag.src);

            return {websiteUrl, avatarLink}
        }

        async close() {
            await this.browser.close();
        }
    }
    
    async function launchPuppeterBrowser(proxyObj) {
        let proxy = `--proxy-server=${proxyObj.ip}:${proxyObj.port}`;

        let launchOpts = {
            headless: IS_HEADLESS,
            ignoreHTTPSErrors : true,
            args: [proxy]
        }
    
        const browser = await puppeteer.launch(launchOpts);
        const page = await browser.newPage();
        await page.authenticate({ 
            username : proxyObj.userName, 
            password : proxyObj.pwd
        });
    
        await page.setViewport({width: 1285, height: 644});
        return {browser, page}
    }
    
    return GoogleScraper;
});
// (function(){
//     var CFG='___grecaptcha_cfg';
//     if(!window[CFG]){
//         window[CFG] = {};
//     }
    
//     var GR='grecaptcha';
//     if(!window[GR]){
//         window[GR] = {};
//     }
    
//     window[GR].ready = window[GR].ready || function(f) {
//         (window[CFG]['fns']=window[CFG]['fns']||[]).push(f);
//     };
    
//     (window[CFG]['render'] = window[CFG]['render'] || []).push('onload');
    
//     window['__google_recaptcha_client']=true;

//     var po = document.createElement('script'); 
//     po.type='text/javascript'; 
//     po.async=true;
//     po.src='https://www.gstatic.com/recaptcha/api2/v1548052318968/recaptcha__en.js';

//     var elem = document.querySelector('script[nonce]');
//     var n = elem && (elem['nonce'] || elem.getAttribute('nonce'));

//     if (n) {
//         po.setAttribute('nonce',n);
//     } 

//     var s = document.getElementsByTagName('script')[0];
//     s.parentNode.insertBefore(po, s);
// })();
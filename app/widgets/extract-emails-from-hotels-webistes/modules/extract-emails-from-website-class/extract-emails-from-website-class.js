const url = require('url');
const EventEmitter = require('events');
const {makeRequest, nodeRequest, nodeFetch} = require('widgets/scraper-utils');
let PushSubPageLinks = require('./modules/push-sub-page-links/push-sub-page-links.js');

module.exports = ((params) => {
    const {websiteUrl, fnId} = params
    const MAX_PAGE_EXTRACTION_COUNT = params.MAX_PAGE_EXTRACTION_COUNT;
    const MAIN_PAGE_URL = websiteUrl;
    process.stdout.write('extraction started: ' + MAIN_PAGE_URL);

    const MAINS_PROTOCOL = url.parse(MAIN_PAGE_URL).protocol;
    const MAINS_FULL_DOMAIN = `${MAINS_PROTOCOL}//${url.parse(MAIN_PAGE_URL).hostname}`;
    const MAIN_PAGE_HOST_NAME = url.parse(MAIN_PAGE_URL).hostname;
    
    let domainPartsOfMainUrl = MAIN_PAGE_HOST_NAME.split('.');
    // sld => second level domain
    const MAIN_SLD = domainPartsOfMainUrl[domainPartsOfMainUrl.length - 2];
    
    let pushSubPageLinks = PushSubPageLinks({
        MAIN_PAGE_URL,
        MAIN_SLD,
        MAINS_PROTOCOL,
        MAINS_FULL_DOMAIN
    })
    
    class EmailExtractor extends EventEmitter{
        constructor(mainPageUrl) {
            super();
            this.emails = [];
            this.subPageUrls = [];
            this.fullSubPageUrls = [];
            this.emailsExtractedUrls = [];
            this.extractedUrlCounter = 0;

            Object.assign(EmailExtractor.prototype, pushSubPageLinks)
            console.log('executionn started: ' + mainPageUrl);
            this.extract(mainPageUrl);
        }

        extract(websiteUrl) {
            console.log(`prom-${fnId}: url: ${this.extractedUrlCounter}`);
            this.extractedUrlCounter++;
            
            makeRequest(websiteUrl)
            .then(html => {
                this.pushEmails(html);
                this.emailsExtractedUrls.push(websiteUrl)
                
                this.pushSubPageLinks(html);
                this.callExtractorOnNextLink();
            })
            .catch(err => {
                console.log(`prom-${fnId} err:`);
                console.log(err)
                this.callExtractorOnNextLink();
            });
        }

        pushEmails(html) {
            let emailsInHtmlArr = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
            emailsInHtmlArr = emailsInHtmlArr || [];
    
            emailsInHtmlArr.forEach(currEmail => {
                let notEmailLookingFile = !/(.*)(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.pdf)$/.test(currEmail);
                let doesntHaveEmail = !this.emails.includes(currEmail);
    
                if (doesntHaveEmail && notEmailLookingFile) {
                    this.emails.push(currEmail);
                }
            })
    
            if (emailsInHtmlArr.length > 0) {
                console.log(`prom-${fnId} ====================`);
                console.log(`prom-${fnId} additional email found on ${MAIN_PAGE_URL} => \n`);
                console.log(emailsInHtmlArr);
                console.log(`prom-${fnId} saved emails:\n`);
                console.log(this.emails);
                console.log(`prom-${fnId}====================`);
            }
        }

        callExtractorOnNextLink() {
            let areUrlsToExtract = this.fullSubPageUrls.length > 0;
            let reachedMaxExtractionCount = MAX_PAGE_EXTRACTION_COUNT <= this.extractedUrlCounter;
    
            if (areUrlsToExtract && !reachedMaxExtractionCount) {
                let nextSubPgToExtract = this.fullSubPageUrls.shift();
                this.extract(nextSubPgToExtract);
            } else {
                console.log(`prom-${fnId} extraction-finished: ${this.emails}`);
                this.emit('extraction-finished', this.emails);
            }
        }
    }

    return new EmailExtractor(MAIN_PAGE_URL, fnId);
});
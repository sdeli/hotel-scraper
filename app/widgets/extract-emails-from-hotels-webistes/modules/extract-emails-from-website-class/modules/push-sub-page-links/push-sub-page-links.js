const cheerio = require('cheerio');

module.exports = ((config) => {
    const {
        MAIN_PAGE_URL,
        MAIN_SLD,
        MAINS_PROTOCOL,
        MAINS_FULL_DOMAIN,
    } = config;
    
    function pushSubPageLinks(html) {
        let $ = cheerio.load(html);
        let allLinksOnPg = $('a').toArray();
        
        allLinksOnPg.forEach((aTag) => {
            try {
                let currUrl = aTag.attribs.href.trim();
                // console.log('maybe: ' + currUrl);
                
                let isValid = checkIfIsSubPageUrl(currUrl) && !this.isLinkDuplicate(currUrl) 
                if (!isValid) return;
    
                this.subPageUrls.push(currUrl);    
                let currValidFullUrl = getAbsoluteLink(currUrl);
                this.fullSubPageUrls.push(currValidFullUrl);
            } catch (error) {
                return;
            }
        });
        
        return;
    }
    
    function checkIfIsSubPageUrl(currUrl) {
        if (currUrl.substr(0, 1) === '#') return false;
    
        let isAction = /^(javascript:|tel:|mailto:)/.test(currUrl);
        if (isAction) return false;
    
        let isFile = /(.*)(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG|\.pdf)$/.test(currUrl);
        if (isFile) return false;
    
        let hasHostnameInUrl = /^(http|\/\/)/.test(currUrl);
        // if no hostname => raltive link/path => subpagelink
        if (!hasHostnameInUrl) return true;
        
        let isSameDomainOrSubDomain = isSameDomainOrSubDomainCheck(currUrl);
        if (isSameDomainOrSubDomain) {
            return true;
        } else if (!isSameDomainOrSubDomain){
            return false;
        }
    
        process.write.stdout('54 unxepected kind of url: ' + currUrl + 'on page: ' + MAIN_PAGE_URL);
        process.stdout.write('54 unxepected kind of url: ' + currUrl + 'on page: ' + MAIN_PAGE_URL);
        return true;
    }
    
    function isSameDomainOrSubDomainCheck(currUrl) {
        let hostname = currUrl.replace(/^(https:\/\/|http:\/\/|\/\/)([a-z0-9._-]+)(\/.*)/, '$2');
        let domainPartsOfCurrUrl = hostname.split('.');
        // sld => second level domain
        let sldOfCurrUrl = domainPartsOfCurrUrl[domainPartsOfCurrUrl.length - 2];
        let isSameDomainOrSubDomain = MAIN_SLD === sldOfCurrUrl;
        return isSameDomainOrSubDomain;
    }
    
    function getAbsoluteLink(currUrl) {
        // let hostname = url.parse(currUrl).hostname;
    
        let isSubPgFullUrl = /^(http:\/\/|https:\/\/)/.test(currUrl);
        if (isSubPgFullUrl) {
            return currUrl;
        }
    
        if (currUrl.substr(0,2) === '//') {
            let fullUrl = currUrl.replace('//', `${MAINS_PROTOCOL}//`);
            return fullUrl;
        }
        
        let isUrlAUrlPath = Boolean(currUrl.match(/^(\w+|\/|\.\/\w+|\.\.\/\w+)/));
        if (isUrlAUrlPath) {
            let urlPath = currUrl.replace(/^(\/|\.\/|\.\.\/)(.*)/, '$2');
            let fullUrl = `${MAINS_FULL_DOMAIN}/${urlPath}`;
            return fullUrl;
        }
    
        let isRelativePath = currUrl.substr(0,3) === '../';
        if (isRelativePath) {
            let fullUrl = `${MAINS_FULL_DOMAIN, currUrl.replace(/^(..\/)(.*)/, '$2')}`;
            return fullUrl; 
        } else {
            process.write.stdout('93 unusual url: ' + currUrl);
            process.stdout.write('94 unusual url: ' + currUrl + 'on page: ' + MAIN_PAGE_URL);
        }
    }
    
    function isLinkDuplicate(currUrl) {
        let isAlreadyQueuedToExtract = this.subPageUrls.includes(currUrl);
        let isAlreadyExtracted = this.emailsExtractedUrls.includes(currUrl);
    
        if (isAlreadyQueuedToExtract || isAlreadyExtracted) {
            return true;
        } else {
            return false;
        }
    }
    
    return {
        pushSubPageLinks,
        isLinkDuplicate
    };
});
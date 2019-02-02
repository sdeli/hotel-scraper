const EventEmitter = require('events');
const getHtml = require('../get-html-class/get-html-class.js');

module.exports = ((config, params) => {
    const {
        IS_HEADLESS,
    } = config;
    
    let GetHtml = getHtml({
        IS_HEADLESS
    })
    
    class GetHtmlQueue {
        constructor(maxRequesterCount) {
            this.maxRequesterCount = maxRequesterCount;
            this.obeserver = new EventEmitter();
            this.tasks = [];
            this.callBacks = [];
            this.freeHtmlRequesters = [];
            
            this.obeserver.on('execute-task', () => {
                let areFreehtmlRequesterToRunTask = this.freeHtmlRequesters.length > 0;
                let areDueTasks = this.tasks.length > 0;
                if (areFreehtmlRequesterToRunTask && areDueTasks) {
                    this.execute();
                }
            })
    
        }
        
        async init() {
            await this.initHtmlRequesters();
        }
        
        addTask(link, cb = []) {
            this.tasks.push({link, cb});
            this.obeserver.emit('execute-task');
        }
        
        execute() {
            let {link, cb} = this.tasks.shift();
            let requester = this.freeHtmlRequesters.shift();
            
            requester.get(link)
            .then(html => {
                this.freeHtmlRequesters.push(requester);
                this.obeserver.emit('execute-task');
                cb(null, html);
            })
            .catch(async(err) => {
                console.log(err);
                await requester.close();
                await this.initSingleHtmlRequester();
                this.obeserver.emit('execute-task');
                cb(err, null);
            })
        }
        
        async initHtmlRequesters() {
            let htmlRequesterCount = this.freeHtmlRequesters.length;

            for (let i = htmlRequesterCount; i < this.maxRequesterCount; i++) {
                await this.initSingleHtmlRequester();
            }
        }
        
        async initSingleHtmlRequester() {
            let htmlRequester = new GetHtml();
            await htmlRequester.init();
            this.freeHtmlRequesters.push(htmlRequester);  
    
            htmlRequester.page.on('error', async (err) => {
                console.log(err);
                this.deleteRequesterFromQueue(htmlRequester);
                await htmlRequester.close();
                this.initHtmlRequesters();
            })
        }

        async shutDownRequesters() {
            this.freeHtmlRequesters.forEach(htmlRequester => {
                htmlRequester.close();
            });
        }

        deleteRequesterFromQueue(htmlRequester) {
            let indexofRequester = this.freeHtmlRequesters.indexOf(htmlRequester);

            let isInQueue = indexofRequester > -1;
            if (isInQueue) {
                this.freeHtmlRequesters.splice(indexofRequester, 1);
            }
        }
    }

    return new GetHtmlQueue(params.maxRequesterCount);
});


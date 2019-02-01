const EventEmitter = require('events');

const maxConcurrentProms = 3;/*CPU_COUNT - 1;*/ // leave one core for the main thread

class PromiseTaskQueue {
    constructor(maxConcurrentPromsArg = maxConcurrentProms) {
        this.maxConcurrentProms = maxConcurrentPromsArg;
        this.obeserver = new EventEmitter();
        this.promiseTasks = [];
        this.runningPromisesCount = 0;
        this.taskCounter = 0;

        this.obeserver.on('execute-task', () => {
            let canRunNewPromise = this.runningPromisesCount < this.maxConcurrentProms;
            let areDueTasks = this.promiseTasks.length > 0;

            if (canRunNewPromise && areDueTasks) {
                this.executePromise();
            }
        });
    }
    
    addPromiseTask(fnPromise, cb, fnParamsArr = [], cbsParamsArr = []) {
        this.promiseTasks.push({fnPromise, cb, fnParamsArr, cbsParamsArr});
        this.obeserver.emit('execute-task');
    }
    
    executePromise() {
        let {fnPromise, cb, fnParamsArr, cbsParamsArr} = this.promiseTasks.shift();
        
        this.taskCounter++;
        console.log('task: ' + this.taskCounter);
        this.runningPromisesCount++
        
        fnPromise(...fnParamsArr)
        .then(results => {
            this.runningPromisesCount--
            this.obeserver.emit('execute-task');
            cb(null, results, ...cbsParamsArr);
        })
        .catch(err => {
            this.runningPromisesCount--
            this.obeserver.emit('execute-task');
            cb(err, null, ...cbsParamsArr);
        });
    }
}

module.exports = PromiseTaskQueue;
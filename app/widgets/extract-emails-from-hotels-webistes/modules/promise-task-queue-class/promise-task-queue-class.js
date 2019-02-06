const EventEmitter = require('events');

const maxConcurrentProms = 3;/*CPU_COUNT - 1;*/ // leave one core for the main thread

class PromiseTaskQueue extends EventEmitter {
    constructor(maxConcurrentPromsArg = maxConcurrentProms) {
        super();
        this.maxConcurrentProms = maxConcurrentPromsArg;
        this.promiseTasks = [];
        this.runningPromisesCount = 0;
        this.taskCounter = 0;

        this.on('execute-task', () => {
            let canRunNewPromise = this.runningPromisesCount < this.maxConcurrentProms;
            let areDueTasks = this.promiseTasks.length > 0;

            if (canRunNewPromise && areDueTasks) {
                this.executePromise();
            }

            let noMoreDueTasks = this.promiseTasks.length === 0;
                noMoreDueTasks &= this.runningPromisesCount === 0;
            if (noMoreDueTasks) {
                this.emit('finished-all-tasks');
            }
        });
    }
    
    addPromiseTask(fnPromise, cb, fnParamsArr = [], cbsParamsArr = []) {
        this.promiseTasks.push({fnPromise, cb, fnParamsArr, cbsParamsArr});
        this.emit('execute-task');
    }
    
    executePromise() {
        let {fnPromise, cb, fnParamsArr, cbsParamsArr} = this.promiseTasks.shift();
        
        this.taskCounter++;
        console.log('task: ' + this.taskCounter);
        this.runningPromisesCount++
        
        fnPromise(...fnParamsArr)
        .then(results => {
            this.runningPromisesCount--
            this.emit('execute-task');
            cb(null, results, ...cbsParamsArr);
        })
        .catch(err => {
            this.runningPromisesCount--
            this.emit('execute-task');
            cb(err, null, ...cbsParamsArr);
        });
    }
}

module.exports = PromiseTaskQueue;
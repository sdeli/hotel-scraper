const os = require('os');
const CPU_COUNT = os.cpus().length;
const EventEmitter = require('events');
const spawn = require('child_process').spawn;

const uniqid = require('uniqid');

const childProcessRunnerFilePath = __dirname + '/modules/child-process/child-process.js';

let maxConcurrency = CPU_COUNT - 1; // leave one core for the main thread

class TaskQueue {
    constructor(maxConcurrencyArg = maxConcurrency) {
        maxConcurrency = maxConcurrencyArg;
        this.obeserver = new EventEmitter();
        this.tasks = [];
        this.callBacks = [];
        this.freeChildProc = [];
        
        this.obeserver.on('execute-task', () => {
            let areFreeChildProcToRunTask = this.freeChildProc.length > 0;
            let areDueTasks = this.tasks.length > 0;
            if (areFreeChildProcToRunTask && areDueTasks) {
                this.execute();
            }
        })

        this.initiateWorkerThreads();
    }
    
    addTask(tasksFilePath, cb, taskParamsArr = [], cbsParamsArr = []) {
        let taskId = uniqid();
        this.tasks.push({taskId, tasksFilePath, cb, taskParamsArr, cbsParamsArr});
        this.obeserver.emit('execute-task')
    }
    
    execute() {
        let {taskId, tasksFilePath, cb, taskParamsArr, cbsParamsArr} = this.tasks.shift();
        this.callBacks.push({taskId, cb, cbsParamsArr})
        let childProc = this.freeChildProc.shift();
        
        childProc.send({taskId, tasksFilePath, taskParamsArr});
    }
    
    initiateWorkerThreads() {
        for (let i = 0; i < maxConcurrency; i++) {
            let childProc = this.initiateWorkerThread();
            this.freeChildProc.push(childProc);  
        }
    }
    
    initiateWorkerThread() {
        let program = "/home/sandor/.nvm/versions/node/v11.7.0/bin/node"
        let options = {
            stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        };
        let parameters = [
            childProcessRunnerFilePath,
        ];
        
        let childProc = spawn(program, parameters, options);
        
        childProc.on('message', msg => {
            
            let didTaskExecuteSuccesfully = !msg.err && msg.results;
            if (didTaskExecuteSuccesfully) {
                this.freeChildProc.push(childProc);
                this.obeserver.emit('execute-task')
                this.runCurrTasksCb(false, msg.taskId, msg.results);
            } 
            
            let taskExecutedWithErr = msg.err && !msg.results
            if (taskExecutedWithErr) {
                console.log('in process message:');
                console.log(msg);
                console.log('in process message end =========');
                this.freeChildProc.push(childProc);
                this.obeserver.emit('execute-task')
                this.runCurrTasksCb(msg.err, msg.taskId, null);
            } 

            if (!didTaskExecuteSuccesfully && !taskExecutedWithErr) {
                console.log('error handling')
                console.log(msg);
                console.log('unexpected happening in proc');
            }
        });

        childProc.stdout.on('data', data => {
            console.log(data.toString());
        });

        childProc.stderr.on('data', data => {
            console.log(data.toString());
        });

        childProc.on('exit', data => {
            this.initiateWorkerThread();
            this.freeChildProc.push(childProc);
        });

        return childProc;
    }

    runCurrTasksCb(err, taskId, results) {
        let cbOfCurrFnObj = getCbOfCurrTask(this.callBacks, taskId)
        // console.log('err handling what if no taskId');
        let cbsParamsArr = cbOfCurrFnObj.cbsParamsArr;
        // console.log('asd');
        cbOfCurrFnObj.cb(err, results, ...cbsParamsArr);
    }
}


function getCbOfCurrTask(callbacks, currTaskId) {
    let cbOfCurrFnObj = callbacks.find(cbObj => {
        isthisCbTheRequestedCb = cbObj.taskId === currTaskId;
        
        return isthisCbTheRequestedCb;
    })
    
    return cbOfCurrFnObj;
}

module.exports = TaskQueue;
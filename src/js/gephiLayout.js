/**
 * Node module for use in node js
 * */

/**
 * Dependencies
 * */
var path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    request = require('request'),
    sq = require('simplequeue'),
    queue = sq.createQueue(),
    async = require('async'),
    freeport = require('freeport');

/**
 * Constant PORT at which the layout server listens
 * */
var PORTA = 0;
var PORTB = 0;

/**
 * Constant JAR FILE path for the target jar file
 * */
const JAR_FILE = path.join(__dirname, '../../out/artifacts/node_gephi_lgl_jar', 'node-gephi-lgl.jar');

/**
 * INIT Function which is called to start the layout server.
 * Callback is called when ready
 * */
exports.init = function (callback) {
    var tasks = [];

    //Kill old
    tasks.push(function (callback) {
        spawn('sh', ['kill.sh'], {env: process.env, cwd: __dirname})
            .on('close', function () {
                callback();
            })
            .on('error', function (err) {
                callback(err)
            });
    });

    //Get ports
    tasks.push(function (callback) {
        freeport(function (err, port) {
            if (err) return callback(err);
            callback(null, PORTA = port);
        })
    });

    tasks.push(function (callback) {
        freeport(function (err, port) {
            if (err) return callback(err);
            callback(null, PORTB = port);
        })
    });

    //Start port A
    tasks.push(function (callback) {
        var serverProcess = spawn('java', ['-jar', JAR_FILE, PORTA], {
            env: process.env,
            cwd: path.join(__dirname, '../../')
        });

        var hasExited = false,
            loaded = false;

        serverProcess.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
            if (data.toString().search(new RegExp('port ' + PORTA)) != -1 && !loaded) {
                loaded = true;
                callback();
            }
        });

        serverProcess.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
            if (!hasExited) {
                hasExited = true;
                callback(data);
            }
        });

        serverProcess.on('close', function (code) {
            console.log('child process exited with code ' + code);
            if (!hasExited) {
                hasExited = true;
                callback(null, code, true);
            }
        });

        serverProcess.on('error', function (err) {
            console.log('ERROR', err);
        });

        serverProcess.on('exit', function (err) {
            console.log('EXIT:', err);
        });
    });

    //Start port B
    tasks.push(function (callback) {
        var serverProcess = spawn('java', ['-jar', JAR_FILE, PORTB], {
            env: process.env,
            cwd: path.join(__dirname, '../../')
        });

        var hasExited = false,
            loaded = false;

        serverProcess.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
            if (data.toString().search(new RegExp('port ' + PORTB)) != -1 && !loaded) {
                loaded = true;
                callback();
            }
        });

        serverProcess.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
            if (!hasExited) {
                hasExited = true;
                callback(data);
            }
        });

        serverProcess.on('close', function (code) {
            console.log('child process exited with code ' + code);
            if (!hasExited) {
                hasExited = true;
                callback(null, code, true);
            }
        });

        serverProcess.on('error', function (err) {
            console.log('ERROR', err);
        });

        serverProcess.on('exit', function (err) {
            console.log('EXIT:', err);
        });
    });

    //Bind queue for Port A
    tasks.push(function (callback) {
        function read() {
            queue.getMessage(function (err, message) {
                if (err) {
                    console.log(err);
                    return setTimeout(read, 100);
                }
                LayoutCalculator._processMessage(message, PORTA, function () {
                    setTimeout(read, 100);
                });
            });
        }

        callback(null, read());
    });

    //Bind queue for Port B
    tasks.push(function (callback) {
        function read() {
            queue.getMessage(function (err, message) {
                if (err) {
                    console.log(err);
                    return setTimeout(read, 100);
                }
                LayoutCalculator._processMessage(message, PORTB, function () {
                    setTimeout(read, 100);
                });
            });
        }

        callback(null, read());
    });

    async.series(tasks, callback);
};

/**
 * @class
 * Layout Calculator
 * */
function LayoutCalculator(dataJson, settings) {
    if (!dataJson) throw new Error('Data JSON not defined!');

    try {
        if (typeof dataJson == 'string' || dataJson instanceof String) {
            dataJson = JSON.parse(dataJson);
        }
    } catch (c) {
        throw (new Error('Invalid data json provided!'));
    }

    if (!dataJson.nodes) throw (new Error('Nodes not defined!'));

    if (!dataJson.links) throw (new Error('Links not defined!'));

    this.tempInFile = path.join(__dirname, '../../workspace', +new Date() + '_' + (Math.random() * 100000) + '.net');

    this.tempOutFile = path.join(__dirname, '../../workspace', +new Date() + '_' + (Math.random() * 100000) + '.json');

    this.data = dataJson;

    console.log('Work files:', this.tempInFile, this.tempOutFile);

    settings = settings || {};
    settings.allowAutoMode = !!settings.allowAutoMode;
    settings.stepDisplacement = settings.stepDisplacement || 1;
    settings.optimalDistance = settings.optimalDistance || 200;
    settings.iterations = settings.iterations || 100;
    settings.saveSvg = !!settings.saveSvg;

    this.settings = settings;

    this.settings.source = this.tempInFile;
    this.settings.target = this.tempOutFile;
}

/**
 * @public
 * @method
 * Calculates the layout
 * */
LayoutCalculator.prototype.calculateLayout = function (callback) {
    var _this = this;

    this._prepareInFile(function (err) {
        if (err) return callback(err);
        _this._runCommand(function (err) {
            if (err) return callback(err);
            _this._mergeOutput(function (err) {
                if (err) return callback(err);
                fs.unlinkSync(_this.tempInFile);
                fs.unlinkSync(_this.tempOutFile);
                callback(null, _this.data);
            })
        });
    });
};

/**
 * @private
 * @method
 * Prepares the temporary input file
 * */
LayoutCalculator.prototype._prepareInFile = function (callback) {
    try {
        var fd = fs.openSync(this.tempInFile, 'w');
        fs.writeSync(fd, '*Vertices ' + this.data.nodes.length + '\n');
        fs.writeSync(fd, '*Edges\n');
        this.data.links.forEach(function (link) {
            fs.writeSync(fd, (parseInt(link.source, 10) + 1) + " " + (parseInt(link.target, 10) + 1) + "\n");
        });
        fs.closeSync(fd);
        callback();
    } catch (c) {
        callback(new Error(c));
    }
};

/**
 * @private
 * @method
 * Runs the calculate command
 * */
LayoutCalculator.prototype._runCommand = function (callback) {
    //Push message
    queue.putMessage({cb: callback, settings: this.settings});
};

LayoutCalculator._processMessage = function (message, port, callback) {
    console.log(message, port);
    request.post('http://localhost:' + port + '/calculate', {
        json: message.settings
    }, function (e, r, b) {
        if (e) {
            message.cb(e);
            callback();
        }
        else if (r.statusCode == 200) {
            message.cb(null, b);
            callback();
        }
        else {
            message.cb(new Error(b));
            callback();
        }
    });
};

/**
 * @private
 * @method
 * Merges the output with input data
 * */
LayoutCalculator.prototype._mergeOutput = function (callback) {
    try {
        var result = require(this.tempOutFile),
            _this = this;
        result.forEach(function (position) {
            _this.data.nodes[position.ref].x = position.x;
            _this.data.nodes[position.ref].y = position.y;
        });
        callback();
    } catch (c) {
        console.log(c);
        callback(c);
    }
};

/**
 * Export the class
 * */
exports.LayoutCalculator = LayoutCalculator;

//Do a self test
exports.selfTest = function (callback) {
    var calculator = new LayoutCalculator({
        nodes: [
            {id: 0},
            {id: 1},
            {id: 2},
            {id: 3},
            {id: 4},
            {id: 5},
            {id: 6},
            {id: 7},
            {id: 8},
            {id: 9},
            {id: 10}
        ],
        links: [
            {source: 5, target: 10},
            {source: 5, target: 3},
            {source: 3, target: 1},
            {source: 3, target: 4},
            {source: 3, target: 2},
            {source: 10, target: 2},
            {source: 2, target: 4},
            {source: 1, target: 4},
            {source: 4, target: 6},
            {source: 6, target: 9},
            {source: 6, target: 7},
            {source: 6, target: 8},
            {source: 6, target: 0},
            {source: 7, target: 0},
            {source: 8, target: 0}
        ]
    }, {saveSvg: true});
    calculator.calculateLayout(function (err, data) {
        if (err) return callback(err, false);
        if (
            data &&
            data.nodes && data.nodes.length == 11 &&
            data.links && data.links.length == 15 &&
            typeof data.nodes[0].x == 'number' && typeof data.nodes[0].y == 'number'
        ) return callback(null, true);
        else return callback(new Error('Not able to populate the layouts'), false);
    });
};
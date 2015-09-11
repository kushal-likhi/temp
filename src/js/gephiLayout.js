/**
 * Node module for use in node js
 * */

/**
 * Dependencies
 * */
var path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    request = require('request');

/**
 * Constant PORT at which the layout server listens
 * */
const PORT = 9263;

/**
 * Constant JAR FILE path for the target jar file
 * */
const JAR_FILE = path.join(__dirname, '../../out/artifacts/node_gephi_lgl_jar', 'node-gephi-lgl.jar');

/**
 * INIT Function which is called to start the layout server.
 * Callback is called when ready
 * */
exports.init = function (callback) {
    spawn('sh', ['kill.sh'], {
        env: process.env,
        cwd: __dirname
    }).on('close', function () {
        console.log('Killed prev');
        var serverProcess = spawn('java', ['-jar', JAR_FILE, PORT], {
            env: process.env,
            cwd: path.join(__dirname, '../../')
        });

        var hasExited = false,
            loaded = false;

        serverProcess.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
            if (data.toString().search(new RegExp('port ' + PORT)) != -1 && !loaded) {
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
    }).on('error', function (err) {
        console.log(err);
    });
};

/**
 * @class
 * Layout Calculator
 * */
function LayoutCalculator(dataJson) {
    if (!dataJson) return callback(new Error('Data JSON not defined!'));

    try {
        if (typeof dataJson == 'string' || dataJson instanceof String) {
            dataJson = JSON.parse(dataJson);
        }
    } catch (c) {
        return callback(new Error('Invalid data json provided!'));
    }

    if (!dataJson.nodes) return callback(new Error('Nodes not defined!'));

    if (!dataJson.links) return callback(new Error('Links not defined!'));

    this.tempInFile = path.join(__dirname, '../../workspace', +new Date() + '_' + (Math.random() * 100000) + '.net');

    this.tempOutFile = path.join(__dirname, '../../workspace', +new Date() + '_' + (Math.random() * 100000) + '.svg');

    this.data = dataJson;

    console.log('Work files:', this.tempInFile, this.tempOutFile);

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
    request.post('http://localhost:' + PORT + '/calculate', {
        json: {
            source: this.tempInFile,
            target: this.tempOutFile
        }
    }, function (e, r, b) {
        if (e) callback(e);
        else if (r.statusCode == 200) callback(null, b);
        else callback(new Error(b));
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
    });
    calculator.calculateLayout(function (err, data) {
        if (err) return callback(err, false);
        if (
            data &&
            data.nodes && data.nodes.length == 4 &&
            data.links && data.links.length == 4 &&
            typeof data.nodes[0].x == 'number' && typeof data.nodes[0].y == 'number'
        ) return callback(null, true);
        else return callback(new Error('Not able to populate the layouts'), false);
    });
};
const MAX_NODES = 500;
const CONNECTIONS_PER_NODE_MAX = 10;
const FILE_NAME = 'generated.net';
var fs = require('fs');
var fd = fs.openSync(FILE_NAME, 'w');

fs.writeSync(fd, '*Vertices ' + MAX_NODES + '\n');
fs.writeSync(fd, '*Edges\n');

var dataObj = {nodes: [], links: []};

for (var i = 0; i < MAX_NODES; i++) {
    dataObj.nodes.push({id: i});
    var numConnections = ~~(Math.random() * CONNECTIONS_PER_NODE_MAX);
    if(numConnections%2) continue;
    var connected = {};
    console.log(i, numConnections);
    for (var j = 0; j < numConnections; j++) {
        var friend = ~~(Math.random() * MAX_NODES);
        if (!connected[friend]) {
            connected[friend] = true;
            fs.writeSync(fd, "" + i + " " + friend + '\n');
            dataObj.links.push({source: i, target: friend});
        }
    }
}

fs.closeSync(fd);

fs.writeFileSync('./generated.json', JSON.stringify(dataObj, null, 4));
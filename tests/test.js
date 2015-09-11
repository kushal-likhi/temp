var lib = require('../');

lib.init(function (err) {
    if (err) return console.log(err);

    lib.selfTest(function (err, passed) {
        console.log(err, passed);
    });

    return; //Disabled
    var ts = +new Date();

    var lc = new lib.LayoutCalculator(require('./samples/generated.json'));

    lc.calculateLayout(function (err, data) {
        console.log(err);
        console.log('Time:', (+new Date() - ts) / 1000, 'Seconds');
        //require('fs').writeFileSync('./.tmp/Kushal-raw.modified.json', JSON.stringify(data));
    });

});
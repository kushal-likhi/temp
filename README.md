#Gephi based Layout#

##Installation##

1. Run `npm install`

This should do the job.

##Configurations##
Shows configurations with default values
```javascript
 saveSvg: true
 allowAutoMode: false
 stepDisplacement: 1
 optimalDistance: 200
 iterations: 100
```

##Node JS Bindings##
Has node js bindings to use it easily in a node project.

Just require this module and start using it as below:

```javascript
var gephiLgl = require('node-gephi-lgl');

//Test if all is good. (Can be done once on app load). Just for demo here.
gephiLgl.selfTest(function (err, passed) {
    console.log(err, passed);
});


var ts = +new Date();

var lc = new gephiLgl.LayoutCalculator({/*input data*/ nodes: [], links: []}, {
    saveSvg: true,
    allowAutoMode: false,
    stepDisplacement: 1,
    optimalDistance: 200,
    iterations: 100
});

lc.calculateLayout(function (err, data) {
    if(err) return console.log(err);

    //Log time taken
    console.log('Time:', (+new Date() - ts) / 1000, 'Seconds');

    //Just saving the output for demo purposes. Used sync for making demo clean.
    require('fs').writeFileSync('./.tmp/Kushal-raw.modified.json', JSON.stringify(data));
});
```
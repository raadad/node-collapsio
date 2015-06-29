var collapsio = require('./collapsio'),
    request = require('request'),
    url = 'http://google.com',
    start = new Date(),
    requestCount = 1000000,
    requestCompleted = 0;

for (var i = 0; i < requestCount; i++) {
    collapsio({}, url, request.get.bind(null, url), function(req, res) {
        requestCompleted++;
        if (requestCompleted === requestCount) console.log("Completed in:", new Date() - start + "ms");
    });
}

var collapsio = require('./collapsio'),
    request = require('request'),
    url = 'http://google.com',
    start = new Date(),
    requestCount = 100,
    requestCompleted = 0;

for (var i = 0; i < requestCount; i++) {
    request.get(url, function(req, res) {
        requestCompleted++;
        if (requestCompleted === requestCount) console.log("Completed in:", new Date() - start + "ms");
    });
}


var collapsio = require('./collapsio'),
    request = require('request'),
    url = 'http://google.com',
    start = new Date(),
    requestCount = 100,
    requestCompleted = 0,
    cachedResponse = null;

for (var i = 0; i < requestCount; i++) {
    if(!cachedResponse){
      request.get(url, function(req, res) {
            cachedResponse = arguments;
            requestCompleted++;
            if (requestCompleted === requestCount) console.log("Completed in:", new Date() - start + "ms");
        });
    } else {
        requestCompleted++;
            if (requestCompleted === requestCount) console.log("Completed in:", new Date() - start + "ms");
    }

}

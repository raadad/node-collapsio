# collapsio.js
provides a helper function that allows the grouping\coalesing of async function calls that have cachable output. This provides more resiliance around cachable code paths that have not been cached yet.

### why?
if you had a route that took 20 seconds to resolve the first time, but was cachable if 1000 users hit that route before it had a chance to resolve it would result in an attempt to resolve that route 1000 times.

collapsio will limit the number of times that route can be executed concurrently and hold the other request until it has been resolved and then passes those results onto the 1000 requests.

### usage

    var collapse = require('./collapsio');

    collapse({}, 'key-http://google.com', request.get.bind(null, 'http://google.com'), function callback(req, res) {
    });

collapse(
- options - object
    - retryTimeout
        - default: 250
        - how long before the action is retried if it has not returned
    - maxTries
        - default: infinity
        - how many times an action is attempted
    - gracePeriod
        - default: 1000
        - how many ms the result of an action will be cached
- key - string
    - used to identify which calls are collapsed\grouped\coallesed together
- action - function
    - a function must be provided that takes a callback as its arguments, functions with more complex interfaces can be curried with fn.bind
- callback - function
     - the function that is executed once the action has been completed or its results have been cached

)
### example
##### This example will simulate 100000 requests to google.com/ over 10 seconds
- Without a cache this would never complete.

        var collapse = require('./collapsio'),
            request = require('request'),
            url = 'http://google.com',
            start = new Date(),
            requestCount = 100000,
            requestCompleted = 0;

        for (var i = 0; i < requestCount; i++) {
            request.get(url, function(req, res) {
                requestCompleted++;
                if (requestCompleted === requestCount) console.log("Completed in:", new Date() - start + "ms");
            });
        }

- With a cache a large number of requests will be created in the time it takes for the first one to return and populate the cache, and in many cases prevent the first request from actually returning.

        var collapse = require('./collapsio'),
            request = require('request'),
            url = 'http://google.com',
            start = new Date(),
            requestCount = 100000,
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

- With collapsio a significantly lower number of requests are made and the result of the first successful request are passed to all of the attempts.

        var collapse = require('./collapsio'),
            request = require('request'),
            url = 'http://google.com',
            start = new Date(),
            requestCount = 100000,
            requestCompleted = 0;

        for (var i = 0; i < requestCount; i++) {
            collapse({}, url, request.get.bind(null, url), function(req, res) {
                requestCompleted++;
                if (requestCompleted === requestCount) console.log("Completed in:", new Date() - start + "ms");
            });
        }





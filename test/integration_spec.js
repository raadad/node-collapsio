var chai = require('chai');
global.expect = chai.expect;

describe('Collapsio Integration', function() {
    var collapse = null;
    beforeEach(function() {
        delete require.cache[require.resolve("../collapsio.js")];
        collapse = require("../collapsio.js");
    });

    it('can collapse 100 requests to a slow async request', function(next) {
        var numberOfCalls = 100,
            callCount = 0,
            completedCount = 0,
            getFavirouteFood = function(callback) {
                setTimeout(function() {
                    callback("fish");
                }, callCount * numberOfCalls);
            },

            callback = function(result) {
                completedCount++;
                if (completedCount === numberOfCalls) next();
            };

        for (var i = 0; i < numberOfCalls; i++) {
            callCount++;
            // getFavirouteFood(callback);
            collapse({}, 'bobsFavFood', getFavirouteFood, callback);
        }

    });

    it('will retry if request does not return in set time', function(next) {
        var callCount = 0,
            getFavirouteFood = function(callback) {
                callCount++;
            },
            callback = function(result) {};

        callCount++;
        // getFavirouteFood(callback);
        collapse({
            retryTimeout: 11
        }, 'bobsFavFood', getFavirouteFood, callback);

        setTimeout(function() {
            expect(callCount).to.equal(10);
            next();
        }, 100);

    });

    it('will only retry a certain number of times', function(next) {
        var callCount = 0,
            getFavirouteFood = function(callback) {
                callCount++;
            },
            callback = function(result) {};

        collapse({
            retryTimeout: 1,
            maxTries: 5
        }, 'bobsFavFood', getFavirouteFood, callback);

        setTimeout(function() {
            expect(callCount).to.equal(5);
            next();
        }, 10);

    });


    it('will execute a function in a given scope', function() {
        var scope = {
                item: 'a'
            },

            getFavirouteFood = function(callback) {
                callback();
            };

        collapse({
            scope: scope
        }, 'bobsFavFood', getFavirouteFood, function() {
            expect(this.item).to.equal('a');
        });

    });



    it('will serve after a callback has finished for a grace period', function(next) {

        var ms = 10,
            callCount = 0,
            getFavirouteFood = function(callback) {
                setTimeout(function() {
                    callback('fish');
                    ms = 99999;
                }, ms);
            };

        collapse({
            gracePeriod: 200
        }, 'bobsFavFood', getFavirouteFood, function() {});


        for (var i = 0; i < 4; i++) {
            setTimeout(function() {
                collapse({}, 'bobsFavFood', getFavirouteFood, function(value) {
                    callCount++;
                    expect(value).to.equal('fish');
                });
            }, 20 * i);
        }

        setTimeout(function() {
            collapse({}, 'bobsFavFood', getFavirouteFood, function(value) {
                expect(value).to.equal('fish');
                next();
            });
        }, 180);

    });


    it('stray requests dont cause multiple callback firings', function(next) {
        var callCount = 0,
            callback = function() {
                callCount++;
            },
            action = function(callback) {
                setTimeout(function() {
                    callback('a');
                }, 20);
            },
            options = {
                retryTimeout: 5
            };

        setTimeout(function() {
            collapse(options, 'test', action, callback);
        });
        setTimeout(function() {
            collapse(options, 'test', action, callback);
        });
        setTimeout(function() {
            collapse(options, 'test', action, callback);
        });
        setTimeout(function() {
            collapse(options, 'test', action, callback);
        });
        setTimeout(function() {
            collapse(options, 'test', action, callback);
        });

        setTimeout(function() {
            expect(callCount).to.equal(5);
            next();
        }, 100);
    });


});

var chai = require('chai');
global.expect = chai.expect;

describe('Collapsio Unit', function() {
    var collapsio = null;
    beforeEach(function() {
        delete require.cache[require.resolve("../collapsio.js")];
        collapsio = require("../collapsio.js");
    });

    it('creates a collapsableStore', function() {
        expect(collapsio.collapsableStore).to.exist;
    });

    it('exposes a collapse function', function() {
        expect(typeof collapsio).to.equal('function');
    });

    describe('collapse', function() {

        it('adds a collapsable to the store', function() {
            collapsio({}, "testkey", function() {});
            expect(collapsio.collapsableStore['testkey']).to.exist;
        });

        it('does not create a collapsable if one already exists', function() {
            collapsio.collapsableStore['testkey'] = {
                testval: 1,
                callbacks: []
            };
            collapsio({}, "testkey", function() {});
            expect(collapsio.collapsableStore['testkey'].testval).to.exist;
        });

        it('will return directly if collapsable has already completed', function() {
            collapsio.collapsableStore['testkey'] = {
                testval: 1,
                callbacks: [],
                completedArguments: ['a']
            };
            collapsio({}, "testkey", function() {}, function(arg) {
                expect(arg).to.equal('a');
            });
        });
        it('adds a collapsable to the store', function() {
            collapsio({}, "testkey", function() {});
            expect(collapsio.collapsableStore['testkey']).to.exist;
        });



        it('provides defaults if no option is specified', function() {

            var mockOptions = {};

            collapsio(mockOptions, "testkey", function() {});
            var collapsable = collapsio.collapsableStore['testkey'];

            expect(collapsable.scope).to.equal(null);
            expect(collapsable.maxTries).to.exist;
            expect(collapsable.retryTimeout).to.exist;
            expect(collapsable.gracePeriod).to.exist;

        });

        it('overrides defaults if supplies', function() {

            var mockOptions = {
                maxTries: 21,
                retryTimeout: 100,
                scope: "testscope",
                gracePeriod: 30
            };


            collapsio(mockOptions, "testkey", function() {});
            var collapsable = collapsio.collapsableStore['testkey'];

            expect(collapsable.scope).to.equal("testscope");
            expect(collapsable.maxTries).to.equal(21);
            expect(collapsable.retryTimeout).to.equal(100);
            expect(collapsable.gracePeriod).to.equal(30);

        });


        it('adds supplied callback to queue of collapsable', function() {
            var mockOptions = {},
                testCallback = function() {};
            testCallback.ishouldexist = 1;

            collapsio(mockOptions, "testkey", function() {}, testCallback);

            var found = null;
            collapsio.collapsableStore['testkey'].callbacks.map(function(callback) {
                if (callback.ishouldexist) found = callback;
            });

            expect(found.ishouldexist).to.exist;
        });

        it('fires call on first invocation', function() {
            var mockOptions = {},
                hit = false;

            collapsio.fireCall = function() {
                hit = true;
            };
            collapsio(mockOptions, "testkey", function() {}, function() {});

            expect(hit).to.be.true;
        });

        it('does not fire call on second invocation', function() {
            var mockOptions = {},
                hit = false;

            collapsio.fireCall = function(collapsable) {
                collapsable.lastAttempt = '100';
                hit = true;
            };

            expect(hit).to.be.false;
            collapsio(mockOptions, "testkey", function() {}, function() {});
            expect(hit).to.be.true;
            hit = false;
            collapsio(mockOptions, "testkey", function() {}, function() {});
            expect(hit).to.be.false;

        });

    });


    describe('fireCall', function() {
        var mockCollapsable;
        beforeEach(function() {
            mockCollapsable =  {
                key: 'testkey',
                action: [Function],
                callbacks: [],
                lastAttempt: null,
                numberOfTries: 0,
                markForDelete: false,
                retryTimeout: 250,
                maxTries: Infinity,
                scope: null,
                gracePeriod: 1000
            };
        });

        it('does not fire if arguments already exist', function() {
            mockCollapsable.completedArguments = ['a'];
            mockCollapsable.action = function() {
                expect(false).to.be.true;
            };
            collapsio.fireCall(mockCollapsable);
        });

        it('does not fire if request has exceded its number of tries', function() {
            mockCollapsable.maxTries = 3;
            var callCount = 0;
            mockCollapsable.action = function() {
                callCount++;
            };
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            expect(callCount).to.equal(3);
        });


        it('delete item out of store once gracePeriod has lapsed', function(next) {
            mockCollapsable.action = function(callback) {
                callback('a');
            };
            mockCollapsable.gracePeriod = 5;
            mockCollapsable.key = 'testapp';
            collapsio.collapsableStore[mockCollapsable.key] = mockCollapsable;


            collapsio.fireCall(mockCollapsable);

            setTimeout(function() {
                expect(collapsio.collapsableStore[mockCollapsable.key]).to.not.exist;
                next();
            }, 20);
        });

        it('assignes completed arguments after a successful call', function() {
            mockCollapsable.action = function(callback) {
                callback('a');
            };
            collapsio.fireCall(mockCollapsable);

            expect(mockCollapsable.completedArguments[0]).to.equal('a');
        });

        it('invokes all callbacks once call returns', function() {
            var callCount = 0,
                callback = function() {
                    callCount++;
                };

            mockCollapsable.callbacks = [callback, callback, callback];

            mockCollapsable.action = function(callback) {
                callback('a');
            };

            collapsio.fireCall(mockCollapsable);
            expect(callCount).to.equal(3);

        });

        it('does not execute request more than once', function() {
            var callCount = 0,
                callback = function() {};

            mockCollapsable.action = function(callback) {
                callCount++;
                callback('a');
            };


            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            collapsio.fireCall(mockCollapsable);
            expect(callCount).to.equal(1);
        });

    });

});

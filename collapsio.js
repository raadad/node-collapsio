module.exports = (function() {
    var self = function collapse(options, key, action, callback) {
        var collapsable = self.collapsableStore[key];

        if (!collapsable) {
            self.collapsableStore[key] = {
                key: key,
                action: action,
                callbacks: [],
                lastAttempt: null,
                numberOfTries: 0,
                markForDelete: false
            };
            collapsable = self.collapsableStore[key];
        }

        if (collapsable.completedArguments)
            return callback.apply(collapsable.scope, collapsable.completedArguments);

        collapsable.retryTimeout = options.retryTimeout || 250;
        collapsable.maxTries = options.maxTries || Infinity;
        collapsable.scope = options.scope || null;
        collapsable.gracePeriod = options.gracePeriod || 1000;
        collapsable.callbacks.push(callback);
        if (!collapsable.lastAttempt) self.fireCall(collapsable, options.retryTimeout);
    };

    self.fireCall = function fireCall(collapsable) {
        if (!collapsable.completedArguments && collapsable.numberOfTries < collapsable.maxTries) {
            collapsable.lastAttempt = new Date().getTime();
            collapsable.numberOfTries = collapsable.numberOfTries += 1;
            collapsable.action(function() {
                if (!collapsable.completedArguments) {
                    setTimeout(function() {
                        delete self.collapsableStore[collapsable.key];
                    }, collapsable.gracePeriod);

                    collapsable.completedArguments = arguments;
                    collapsable.callbacks.map(function(callback) {
                        callback.apply(collapsable.scope,  collapsable.completedArguments);
                    });
                }
            });

            setTimeout(self.fireCall.bind(null, collapsable), collapsable.retryTimeout);
        }
    };

    self.collapsableStore = {};

    return self;
}());

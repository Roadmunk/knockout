ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'rateLimit': function(target, options) {
        var timeout, method, limitFunction;

        if (typeof options == 'number') {
            timeout = options;
        } else {
            timeout = options['timeout'];
            method = options['method'];
        }

        limitFunction = method == 'notifyWhenChangesStop' ?  debounce : throttle;
        target.limit(function(callback) {
            return limitFunction(callback, timeout);
        });
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always" ?
            null :  // null equalityComparer means to always notify
            valuesAreExactlyEqual;
    }
};

/* original Knockout comparer; not used in favour of valuesAreExactlyEqual
var primitiveTypes = { 'undefined':1, 'boolean':1, 'number':1, 'string':1 };
function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}*/

function valuesAreExactlyEqual(a, b) {
    if (a && b && typeof a === "object" && typeof b === "object") {
        if (a.constructor !== b.constructor) return false;

        // Dates are considered equal if their values match
        if (a.constructor === Date)
            return a.valueOf() === b.valueOf();

        // arrays are considered equal if all of their elements match
        if (a.constructor === Array) {
            if (a.length != b.length) return false;
            for (var i=a.length-1; i>0; i--)
                if (!valuesAreExactlyEqual(a[i], b[i])) return false;
            return true;
        }

        // this currently only works for POJOs (hence the constructor == Object rather than a instanceof Object)
        if (a.constructor === Object) {
            var keys = Object.keys(a);
            if (keys.length !== Object.keys(b).length) return false;

            for (var i=keys.length-1; i>0; i--) {
                var key = keys[i];
                if (!b.hasOwnProperty(key)) return false;
                if (!valuesAreExactlyEqual(a[key], b[key])) return false;
            }

            return true;
        }
    }

    return a === b;
}

function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = setTimeout(function() {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = setTimeout(callback, timeout);
    };
}

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

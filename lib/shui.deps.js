
var cosinedesign = cosinedesign || {};
cosinedesign.toolbox = {};

//noinspection BadExpressionStatementJS
(function (toolbox) {


/**
 * Created by Jim Ankrom on 12/14/2014.
 */

// Delimit all optional arguments with delimiter
function delimit (delimiter) {
    var out;
    for (var i=1; i < arguments.length; i++)
    {
        if (out) {
            out+=delimiter;
        } else {
            out = '';
        }
        out+=arguments[i];
    }
    return out;
}



/**
 * Created by Jim Ankrom
 */
// Multicast pipeline, useful for event handlers
// inspired by .NET delegate
function multicast (callback) {
    var callbacks, disabled;

    // TODO: allow callback to be an array

    if (callback) add(callback);

    // main method of execution
    function invoke () {
        if (disabled) return;
        if (!callbacks) return;
        // TODO: testing for callbacks.length is NOT the right way to test for an array
        var i, results, len = callbacks.length;

        if (typeof callbacks == 'function') return callbacks.apply(this, arguments);

        results = [];
        if (len) {
            for (i = 0; i < len; i++) {
                results.push(callbacks[i].apply(this, arguments));
            }
        } else {
            if (callbacks) results.push(callbacks.apply(this, arguments));
        }

        return results;
    }

    // Add callback to the multicast
    function add (callback) {
        // TODO: allow callback to be an array of callbacks

        if (callbacks) {
            if (callbacks.push) {
                callbacks.push(callback);
            }
            else {
                callbacks = [callbacks, callback];
            }
        } else {
            callbacks = callback;
        }

        return this;
    }

    // Remove callback from the multicast
    function remove (callback) {
        var i, len = callbacks.length;

        if (callback && len > 1) {
            for (i = 0; i < len; i++) {
                if (callbacks[i] === callback) {
                    callbacks.splice(i, 1);
                    return;
                }
            }
        } else {
            // only one callback in the multicast
            callbacks = null;
        }
        return this;
    }

    // Expose add and remove methods on the invoke function
    invoke.add = add;
    invoke.remove = remove;

    // Enable the multicast
    invoke.enable = function () {
        disabled = false;
        return this;
    };

    // Disable the multicast
    invoke.disable = function () {
        disabled = true;
        return this;
    };

    return invoke;
}

/**
 * Created by Jim Ankrom on 2/3/2016.
 */

// A lifecycle is an ordered series of callbacks, that are executed in the order specified in phases
// This is essential for beforePhase / phase / afterPhase style handlers
// Depends on multicast, property
function lifecycle (phases, callbacks) {
    // iterate over the phases, import the callbacks as multicasts
    var i,
        key,
        callback,
        len = phases.length,
        state = {};

    for (i=0; i < len; i++) {
        key = phases[i];
        callback = callbacks[key];
        if (callback) state[key] = multicast(callback);
    }

    function invoke () {
        var i,
            len = invoke.phases.length,
            results = [];

        for (i = 0; i < len; i++) {
            results.push(invoke.handlers[invoke.phases[i]].apply(this, arguments));
        }
        return results;
    }

    // expose access to phases
    invoke.phases = phases;
    // TODO: assess if this should be a property. We may prefer to encapsulate access to this... but is that moot?
    invoke.handlers = state;

    return invoke;
}
/**
 * Created by Jim Ankrom on 1/31/2016.
 *
 * Property toolkit
 *
 * To enable:
 * - Lazy loaded properties
 * - Observeable properties
 * - Transformations / calculated properties
 *
 */

// TODO: test for memory leaks

/*
    options.loader
    options.observer (can also function as transform
 */


/*

 When we initialize a property, it should be extensible
 set.transform
 set.observer
 get.loader

 * */

function buildLoader (state, callback) {
    return function () {
        if (!(state.value)) {
            state.value = callback();
        }
        return state.value;
    };
}
function buildObserver (state, callback, target) {
    return function (value) {
        state.value = callback(value, state.value, target)
    };
}

function property (name, options, target) {
    // target last to allow bind / call / apply to override this
    target = target || this;
    var state = {},
        getter,
        setter;

    if (options.loader) {
        getter = buildLoader(state, options.loader, target);
    } else {
        getter = function () {
            return getter.state.value;
        };
    }
    getter.state = state;

    if (options.observer) {
        setter = buildObserver(state, options.observer, target);
    } else {
        setter = function (value) {
            state.value = value;
            return value;
        };
    }

    //var definition = {
    //    enumerable: true,
    //    configurable: false,
    //    writable: false,
    //    value: null
    //};

    Object.defineProperty(target, name, {
        get: getter,
        set: setter
    });

    return this;
}



/**
 * Created by Jim Ankrom on 1/30/2016.
 */

// Turn pipe on and off
// TODO: perhaps this is the 'throttle' gate?
// TODO: allow options to accept a gate method and an invoker method
// TODO: this cannot be used in the middle of a pipe - it is asynchronous. Perhaps there's a way to attach a throttle into a pipe?
/**
 *
 * @param callback
 * @param options { open }
 * @returns {invoke}
 */
function throttle (callback, options) {
    options = options || {};
    options.open = options.open || true;
    options.gater = options.gater || simpleGate;
    //options.count = options.count || 0;
    //options.originalCount = options.count;

    // Open the gate
    function on() {
        options.open = true;
    }

    // Close the gate
    function off() {
        options.open = false;
    }

    // Basic on/off gate
    function simpleGate () {
        return options.open;
    }

    // TODO: Future
    //function countedGate () {
    //    // If there's a limit set, evaluate / update it
    //    options.count--;
    //    if (!options.count) invoke.off();
    //    return simpleGate();
    //    // TODO: reset if needed
    //}
    //// Only allow n# of iterations then stop
    //function count(value) {
    //    options.originalCount = value;
    //    invoke.reset();
    //}

    // TODO: raise an event when this is called
    function statefulInvoker () {
        callback.apply(null, options.arguments);
    }

    function start_interval () {
        // TODO: this isn't the right invoker, I think.
        options.intervalId = setInterval(statefulInvoker, options.interval);
    }

    function stop_interval () {
        clearInterval(options.intervalId);
    }

    // send values on interval, regardless of input
    function interval (interval) {
        options.stateful = true;
        options.interval = interval || options.interval;
        // Turn off the usual gate
        off();
        start_interval();
    }

    // Reset everything in the valve
    function reset() {
        // options.count = options.originalCount;
        if (options.intervalId) {
            stop_interval();
        }
        on();
    }

    // Invoke function to invoke the throttle
    function invoke() {
        // TODO: consider an arguments filter to be applied that evaluates raising an onchange?
        // TODO: consider a gate that only sends when we have changed data
        if (arguments.length) options.arguments = arguments;
        if (options.gater && options.gater()) {
            return callback.apply(null, options.arguments);
        }
    }

    // Build invoke
    invoke.on = on;
    invoke.off = off;
    invoke.reset = reset;
    invoke.interval = interval;
    invoke.interval.stop = stop_interval;
    invoke.interval.start = start_interval;

    return invoke;
}
/**
 * Created by Jim Ankrom on 3/3/2016.
 */
// var p = pipe(callback1)
//  .then(callback2)
//  .then(callback3)
//  .then(callback4)
/**
 *
 * @param callback
 * @returns {invoke}
 */
function pipe(callback) {

    var _current;

    if (callback) {
        _current = function (data) {
            return callback(data);
        };
    }

    var invoke = function (data) {
        if (_current) return _current(data);
        return data;
    };

    // Next needs to wrap current
    invoke.next = function (callback) {
        var previous = _current;

        if (_current) {
            _current = function (data) {
                var result = previous(data);
                return callback(result);
            };
        } else {
            _current = function (data) {
                return callback(data);
            };
        }

        return this;
    };

    invoke.add = function (callbacks) {
        // TODO: support an each method
        var i, item, len = callbacks.length;

        // support to add one function (you really should use NEXT)
        if (typeof callbacks == 'function') {
            invoke.next(callbacks);
        } else {
            for (i = 0; i < len; i++) {
                item = callbacks[i];
                invoke.next(item);
            }
        }
        return this;
    };

    return invoke;
}

/**
 * Created by Jim Ankrom on 1/30/2016.
 */

// Depends on multicast

        // Make target into an evented object
        // Depends on multicast
        function events (target, events) {
    //options = options || {};
    var targetEvents = events || {};

    // add event handler for event
    target.on = function (eventName, handler) {
        if (!targetEvents) targetEvents = {};
        if (!targetEvents[eventName]) {
            targetEvents[eventName] = multicast(handler);
        } else {
            targetEvents[eventName].add(handler);
        }
        return this;
    };

    // remove specific event
    target.off = function (eventName, callback) {
        doIfExists(eventName, function (handlers) {
            handlers.remove(callback);
        });
    };

    // remove all events
    target.allOff = function () {
        targetEvents = {};
    };

    // enable the event
    target.enableEvent = function (eventName) {
        doIfExists(eventName, function (handlers) {
            handlers.enable();
        });
    };

    // disable the event
    target.disableEvent = function (eventName) {
        doIfExists(eventName, function (handlers) {
            handlers.disable();
        });
    };

    // trigger the event
    target.trigger = function (eventName) {
        var myEvent = eventName;
        [].splice.call(arguments, 0, 1); // slick hack to shift arguments "array" that isn't an array
        var thatArgs = arguments;
        doIfExists(myEvent, function (handlers) {
            handlers.apply(target, thatArgs);
        });
        return this;
    };


    function doIfExists(eventName, action) {
        if (targetEvents) {
            var handlers = targetEvents[eventName];
            if (handlers) {
                action(handlers);
            }
        }
    }

    return target;
}

/**
 * Created by Jim Ankrom on 3/12/2016.
 */

function log (message, logModule, logObject) {
    if (this.debug) {
        if (console && console.log) {
            var extended = '';
            if (logObject) extended = ': ' + JSON.stringify(logObject);
            if (logModule)
                console.log('[' + logModule + '] - ' + message + extended );
            else
                console.log(message + extended );
        }
    }
}






toolbox.multicast = multicast;
toolbox.lifecycle = lifecycle;
//toolbox.observe = observe;
toolbox.throttle = throttle;
toolbox.property = property;
toolbox.events = events;
toolbox.pipe = pipe;
toolbox.log = log;

})//noinspection BadExpressionStatementJS
(
    cosinedesign.toolbox
);



/**
 * Created by cosinezero on 3/8/2016.
 */
var sway = sway || {};
(function (rootNS, toolbox) {
    var sway = rootNS,
        multicast = toolbox.multicast;

/**
 *
 *   Sway Socket Extensions
 *   Created by Jim Ankrom on 12/14/2014.
 *
 *   - Multicast Events
 *   -
 *
 *   Requires:
 *   - Engine.io ( repo at https://github.com/Automattic/engine.io-client )
 *   - Multicast ( clone at https://gist.github.com/087c895971dc20ce9e37.git )
 *
 *   Reference:
 *   engine.io's packet prefixes -
   var packets = exports.packets = {
        open:     0    // non-ws
      , close:    1    // non-ws
      , ping:     2
      , pong:     3
      , message:  4
      , upgrade:  5
      , noop:     6
    };
 */
sway.Socket = function (config) {
    var self = this;
    this.verbose = true;
    var delimiter = this.delimiter = config.delimiter || '|';
    var socket;

    this.log = function (source, data) {
        if (self.verbose && console) console.log('[' + source + ']: ' + JSON.stringify(data));
    };

    // Assign handlers
    this.onHandshake = multicast(self.log.bind(self, 'handshake'));
    this.onConnect = multicast(self.log.bind(self, 'connect'));
    this.onMessage = multicast(self.log.bind(self, 'message'));
    this.onClose = multicast(self.log.bind(self, 'close'));
    this.onError = multicast(function (error) {
        //if (bleepout.debug && console)
        console.log('Socket Error: ' + error.message);
    });
    this.onOpen = multicast(function () {
        socket.on('message', self.onMessage);
        socket.on('close', self.onClose);
        socket.on('error', self.onError);
        self.onConnect("Entering Connect");
    });

    this.connect = function () {
        /*
            ( Engine.io - in reverse order)
            open is emitted by Socket.onOpen and Transport.onOpen
            Socket.onOpen is called by socket.onHandshake
            Socket.onHandshake is called by Socket.onPacket
            Socket.onPacket is a pass-through call from Transport's 'packet' event handler
            Transport's packet event is emitted by Transport.onPacket
            Transport.onPacket is raised by Transport.onData after calling parser.decodePacket
        */
        socket = eio(config.address, { "transports": ['websocket']});
        socket.on('open', self.onOpen);
        socket.on('handshake', self.onHandshake);
    };

    this.send = function (message) {
        if (socket) {
            if (self.verbose) self.log('send', JSON.stringify(message));
            socket.send(message);
        }
    };

    return this;
};

/**
 * Created by cosinezero on 5/6/2016.
 */

// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
sway.WebSocket = function (config) {
    var self = this,
        socket = new WebSocket(config.address);

    wire(socket, self);

    //this.onConnect = multicast();
    this.onOpen = multicast();
    this.onMessage = multicast();
    this.onClose = multicast();

    function wire(s, thisRef) {
        var self = thisRef;

        s.onopen = function (e) {
            self.onOpen(e);
        };

        s.onmessage = function (e) {
            self.onMessage(e);
        }
    }

    /**
     * Close the socket.
     * @param reopen - reopen the socket if we have another message to send
     */
    this.close = function (reopen) {
        self.reopen = reopen;
        socket.close();
        self.onClose(self.reopen);
    };

    /**
     * Send a message
     * @param message - string message
     */
    this.send = function (message) {
        if (socket) {
            socket.send(message);
        } else {
            if (self.reopen) {
                socket = new WebSocket(config.address);
                wire(s, self);
            }
        }
    };

    /**
     * Sends a JSON object
     * @param json - JSON object to send
     */
    this.JSON = function (json) {
        self.send(JSON.stringify(json));
    };

    return this;
};
/**
 * Created by cosinezero on 4/20/2016.
 */

sway.actions = {
    // Show the splashscreen for the installation
    "splash": function () {},
    // Show intro message
    "intro": function () {},
    // Confirm user wants to join
    "confirm": function () {},
    // Select shape for the user
    "shape": function () {},
    // Calibrate user into the system
    "calibrate": function (data) {
    },
    // Notify user that they are waiting
    "queue": function () {},
    // Enter play state
    "play": function () {},
    // Quit the interation
    "quit": function () {}
};

sway.workflow = {
    action: function (name, data) {
        var action = sway.actions[name];
        if (action) action(data);
    },
    next: function () {
        // post to the action API
        sway.api.post(config.api.address + config.api.action, {}, {});
    }
};
/**
 * Created by Jim Ankrom on 8/16/2014.
 *
 * sway.user is the library which will control client authorization, establish server connections
 *
 * It requires the existence of global a config variable 'sway'
 *
 * sway.config
 * sway.templates
 * sway.plugins
 * sway.user
 * sway.api
 * sway.sockets
 *
 */
// default config. Note that these values can be overwritten at any time by a message from sway
//sway.hostname = "http://sway.videobleep.tv";
sway.debugPanel = null;
sway.outputPanel = null;
sway.alertCount = 0;
sway.debug = true;
/**
 *
 * sway.config
 *
 */
sway.config = {
    "debug": "verbose",
    "url": 'http://127.0.0.1:1000',
    "ui": {
        // maximum alert messages allowed
        "maxAlerts": 10
    },
    "user": {
        heartbeatInterval: 250,
        // interval, in milliseconds, that motion control messages are sent
        controlInterval: 50,
        // time, in milliseconds, before an idle user times out
        idleTimeout: 10000
    },
    "api": {
        "heartbeat": "/pulse",
        "users": "/users",
        "action": "/action",
        "control": "/control",
        "osc": "/osc",
        "deleteUser": "/delete",
        "monitor": "/monitor"
    },
    update: function (config)  {
        if (!config) return;
        if (config.heartbeatInterval) sway.config.user.heartbeatInterval = config.heartbeatInterval;
        if (config.idleTimeout) sway.config.user.idleTimeout = config.idleTimeout;
        if (config.controlInterval) sway.config.user.controlInterval = config.controlInterval;
        if (config.serverUrl) sway.config.url = config.serverUrl;
        if (config.api) sway.config.api = config.api;
    }
};

sway.plugins = {
    getList: function () {
        if (sway.plugins.list == null)
        { sway.plugins.list = []; }
        return sway.plugins.list;
    },
    register: function (plugin) {
        this.getList().push(plugin);
        plugin.init.call(plugin);
    }
};

sway.templates = {
    dataRow: function (label, value) {
        return '<tr><td>' + label + '</td><td>' + value + '</td></tr>';
    },
    message: function (message) {
        return '<div>' + message + '</div>';
    }
};

/**
 *
 * Sway bootstrapping
 *
 */
// sway oninitialized event - wire into this to run things once sway has been initialized.
//sway.oninitialized = multicast(function () {
//    // initialize plugins here or override this
//    sway.motion.init();
//});

/**
 *
 * init(config)
 */
sway.init = function () {

    if (sway.hostname) {
        if (window.location.origin != sway.hostname) {
            window.location.href = sway.hostname;
            return;
        }
    }

    if (!(sway.config.url)) return sway.debug('sway.config.url is not set!');
    sway.user.authorize();

    // TODO: replace this with an event system. Output should be up to implementations, not the library.
    sway.outputPanel = document.createElement('div');
    document.body.appendChild(sway.outputPanel);
};

// Sway User Module
sway.user = {
    token: {},
    channel: {},
    queue: {},
    user: {},
    // TODO: Verify: Engine.io sockets already provide a heartbeat.
    setHeartbeat: function () {
        // set a value to compare to in setInterval closure
        var timestamp = Date.now();

        sway.user.idleTimestamp = timestamp;

        // Set up a heartbeat to ensure that if we're in an idle queue we still can get a channel update.
        if (!sway.heartbeat) {
            console.log('Initiating heartbeat');
            sway.heartbeat = window.setInterval(function () {
                // if there has been no change in the timestamp, we are idle
                var isIdle = (sway.user.idleTimestamp == timestamp);

                //if (sway.motion.idle(isIdle)) {
                //    window.clearInterval(sway.poll);
                //    return;
                //}

                sway.api.get( sway.config.url + sway.config.api.heartbeat, {}, {});
            }, sway.config.user.heartbeatInterval);
        }
    },
    authorize: function (callback) {
        // post to url/users
        sway.api.post(sway.config.url + "/users", sway.user.user, {
                success: function (req, res) {
                    // alert('Authorized! - ' + JSON.stringify(res.channel));
                    if (callback) callback.call(sway, res);
                    if (sway.oninitialized) { sway.oninitialized.call(sway, res); }
                },
                error: function (err, res) {
                    sway.alert('error ' + JSON.stringify(err));
                }
            }
        );
    }
};

// TODO: Is this working / correct?
//sway.sockets = {
//    init: function () {
//        sway.sockets.socket = io.connect(sway.config.socketAddress);
//        socket.on('user-update', sway.sockets.handleUpdate);
//    },
//    // handle updates from the server
//    handleUpdate: function (data) {},
//    emit: function () {}
//};

// TODO: Workflow controller
//sway.workflow = {
//    onAction: function (res) {
//        // TODO: JIM - fill in actions code here
//        // execute actions[res.action]();
//        var action = sway.actions[res.action];
//        if (action) action();
//    },
//    // Move the workflow to next step
//    next: function () {
//        // post to the action API
//        sway.api.post(config.api.address + config.api.action, {}, {});
//    }
//};

// Sway API calls and utilities
sway.api = {
    onDie: multicast(function () {
        if (sway.heartbeat) {
            window.clearInterval(sway.heartbeat);
        }
    }),
    onUserUpdate: multicast(function (res) {
        sway.user.user = res.user;
    }),
    onUserExpired: multicast(function (res) {
        sway.user.queue = null;
        sway.user.channel = null;
        // TODO: kill user's cookie
    }),
    onUserToken: multicast(function (res) {
        sway.user.token = res.token;
    }),
    onChannelChange: multicast(function (res) {
        console.log('Channel Changed');
        if (sway.debug) console.log(res);
        sway.user.queue = null;
        sway.user.channel = res.channel;
        sway.config.channel = res.channel;
    }),
    onStateChange: multicast(function (res) {
        console.log('State Changed');
        if (res.state) {
            sway.workflow.action(res.state.name, res);
        }
    }),
    onQueueChange: multicast(function (res) {
        console.log('Queue Changed');
        sway.user.queue = res.queue;
    }),
    onMessage: multicast(function (res) {
        sway.alert(res.messages);
    }),
    // Handles standard Sway Server return messages (non-request specific)
    processResponse: function (data) {
        try {
            if (!data) return;
            // TODO: Each of these should raise events, not just set the data.
            // TODO: This should all be in a pipeline of methods acting on the response
            sway.config.update(data.config);
            //console.log(JSON.stringify(data.token));
            if (data.runslashdie) sway.api.onDie();
            if (data.user) sway.api.onUserUpdate(data);
            if (data.token) sway.api.onUserToken(data);
            if (data.queue) sway.api.onQueueChange(data);
            if (data.channel) sway.api.onChannelChange(data);
            if (data.state) sway.api.onStateChange(data);
            if (data.messages) sway.api.onMessage(data);
            if (data.redirect) {
                document.location.href = data.redirect;
            }
        } catch (err) {
            alert('processResponse' + err);
        }
    },
    addTokenToParams: function (params) {
        if (sway.user) {
            if (sway.user.token) {
                params.token = sway.user.token;
            }
        }
    },
    delete: function (url, params, options) {
        sway.api.addTokenToParams(params);
        return sway.api.request(url, 'DELETE', params, options);
    },
    get: function (url, params, options) {
        sway.api.addTokenToParams(params);
        return sway.api.request(url, 'GET', params, options);
    },
    post: function (url, params, options) {
        sway.api.addTokenToParams(params);
        return sway.api.request(url, 'POST', params, options);
    },
    put: function (url, params, options) {
        sway.api.addTokenToParams(params);
        return sway.api.request(url, 'PUT', params, options);
    },
    request: function (url, verb, params, options) {
        try {
            var options = options || {};
            if (window.XMLHttpRequest) {
                var http = new XMLHttpRequest();
                http.withCredentials = true;
                options.responseType = options.responseType || "json";
                if (http.responseType) http.responseType = options.responseType;

                http.onreadystatechange = function () {

                    if (http.readyState == 4) {
                        if (http.status == 200) {
                            var response;

                            if (!http.responseType) {
                                if (options.responseType == 'json' && http.responseText) {
                                    try {
                                        response = JSON.parse(http.responseText);
                                    } catch (ex) {
                                        response = ex;
                                    }
                                } else {
                                    response = http.responseText;
                                }
                            }
                            // TODO: this should be an event, or this should return a promise
                            sway.api.processResponse(response);

                            try {
                                if (options.success) {
                                    options.success(http, response);
                                }
                            } catch (err) {
                                sway.alert('Error in options.success: ' + err);
                            }
                        } else {
                            sway.alert('Error: Response status ' + http.status + ' returned for ' + http.url + ' URL: ' + url);
                            if (options.error) {
                                options.error(http, http.response);
                            }
                            sway.debug('Error: Response status ' + http.status + ' returned for ' + http.url + ' URL: ' + url);
                        }
                    }
                };
                var message = JSON.stringify(params);
                //console.log(url);
                http.open(verb, url, true);
                http.setRequestHeader('Accept', '*/*');
                http.setRequestHeader('Content-Type', 'application/json');

                //http.setRequestHeader("Content-Length", message.length);
                //http.send(params);
                http.send(message);
                return http;
            }
            // because IE5&6 needs to go away
            return sway.debug('You are using a browser that does not support required technology for Sway!');
        } catch (err) {
            alert(err.message);
        }
    }
};

sway.debug = function (message) {
    if (console && console.log) {
        console.log(message)
    } else {
        sway.alert(message);
    }
};

sway.alert = function (message) {
    if (message.isArray && message.isArray()) {
        for (var i=0; i < message.length; i++)
        {
            sway.addMessage(message);
        }
    }
    else
        sway.addMessage(message);
};

sway.addMessage = function (message){
    sway.alertCount++;
    if (sway.alertCount > sway.config.ui.maxAlerts) return;
    var p = document.createElement('p');
    var t = document.createTextNode(message);
    p.appendChild(t);
    sway.outputPanel.appendChild(p);
};

sway.renderDebugEvent = function (panel, e) {
    var c = this.calibration;
    if (!c) return;
    var o = c.orientation,
        m = c.motion,
        r = c.rotation,
        i = c.motionInterval,
        p = c.position,
        t = sway.templates;

    var output = "<table>";
    if (sway.user) {
        output += t.dataRow('User Id', sway.user.token.uid);
        output += t.dataRow('Channel', sway.user.channel.display || sway.user.channel.name);
        output += t.dataRow('Description', sway.user.channel.description);
    }
    if (c.compassHeading) {
        output += t.dataRow('Compass', c.compassHeading);

    }
    if (o) {
        output += t.dataRow('Corrected', c.correctAlpha);
        output +=
            t.dataRow('absolute', o.absolute)
            + t.dataRow('alpha', o.alpha)
            + t.dataRow('beta', o.beta)
            + t.dataRow('gamma', o.gamma);
    }
    if (m) {
        output +=
            t.dataRow('accel.X', m.x)
            + t.dataRow('accel.Y', m.y)
            + t.dataRow('accel.Z', m.z);

    }
    if (r) {
        output +=
            t.dataRow('rot alpha', r.alpha)
            + t.dataRow('rot beta', r.beta)
            + t.dataRow('rot gamma', r.gamma);
    }
    // position.coords.latitude
    // position.coords.longitude
    // position.coords.accuracy
    // position.coords.altitude
    // position.coords.altitudeAccuracy
    // position.coords.heading
    // position.coords.speed
    if (p) {
        output +=
        t.dataRow('latitude', p.coords.latitude)
        + t.dataRow('longitude', p.coords.longitude)
        + t.dataRow('accuracy', p.coords.accuracy)
            + t.dataRow('altitude', p.coords.altitude)
            + t.dataRow('altitudeAccuracy', p.coords.altitudeAccuracy)
        + t.dataRow('accuracy', p.coords.heading)
        + t.dataRow('altitude', p.coords.speed);
    }
    if (sway.motion.icon) {
        var ic = sway.motion.icon.style;
        output +=
            t.dataRow('Left', ic.left)
            + t.dataRow('Top', ic.top)

    }

    output += "</table>";
    sway.debugPanel.innerHTML = output;
};

window.addEventListener('load', function () {
    var element = document.getElementById('debugPanel');
    if (element) {
        sway.debugPanel = element;
    }
});

/**
 * Created by Jim Ankrom on 3/7/2016.
 *
 * Controller for sway gaming and interactions
 * Supports actions, configurations, lifecycle
 */

var controller = {
    init: function () {
        // connect to server
    },
    load: function () {}

};

/**
 * Created by cosinezero on 3/20/2016.
 */
(function (rootNS) {
    var config = {
        "api": {
            "management": {
                "address": "http://127.0.0.1:11100",
                "timer": "/timer"
            }
        }
    };
    var timer,
        timerURI = config.api.management.address + config.api.management.timer;

    rootNS.management = {
        getTimer: function () {
            sway.api.post(timerURI, {}, {
                success: function (http, response) {
                    timer = response;
                    console.log('Timer: ' + JSON.stringify(timer));
                }
            });
        },
        updateTimer: function () {
            if (timer) {
                sway.api.put(timerURI, {id: timer.id}, {
                    success: function (http, response) {
                        timer = response;
                        console.log('Timer: ' + JSON.stringify(timer));
                    }
                });
            }
        }
    };


})(
    sway
);
})(
    sway,
    cosinedesign.toolbox
);


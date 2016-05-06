/**
 * Created by cosinezero on 2/23/2016.
 */

var shui = {};

//noinspection BadExpressionStatementJS
(function (水, tools) {
    //noinspection BadExpressionStatementJS
    var multicast = tools.multicast,
        log = tools.log;


/**
 * 水.motion - Created by Jim Ankrom on 9/14/2014.
 *
 * References:
 * http://www.w3.org/TR/orientation-event/
 * https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained
 * http://diveintohtml5.info/geolocation.html

 * X, Y, Z - East, North, Up (off the device)
 * Alpha - Yaw
 * Beta - Pitch
 * Gamma - Roll
 *
 * Alpha 0 is north; compass counts up counter-clockwise
 *
 * Device lying flat horizontal pointing west:
 *  {alpha: 90, beta: 0, gamma: 0};
 *
 */
//webkitCompassHeading and webkitCompassAccuracy
// https://developer.apple.com/library/iad/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/
// see this https://github.com/w3c/deviceorientation/issues/6
水.motion = {
    onMotion: multicast(),
    onOrientation: multicast(),
    init: function () {
        // Detect Browser Capabilities and wire up events for each
        if ('ondeviceorientationabsolute' in window) {
             水.motion.capabilities.orientation = true;
        //    // We can listen for the new deviceorientationabsolute event.
        //    window.addEventListener('deviceorientationabsolute', 水.motion.handleOrientationEvent.bind(水.motion));w

            window.ondeviceorientationabsolute = 水.motion.handleOrientationEvent.bind(水.motion);
            //alert('Adding absolute handler');
        } else if ('ondeviceorientation' in window) {
            //alert('Adding orientation handler');
            水.motion.capabilities.orientation = true;
        //    // We can still listen for deviceorientation events.
        //    // The `absolute` property of the event tells us whether
        //    // or not the degrees are absolute.
            window.addEventListener('deviceorientation', 水.motion.handleOrientationEvent.bind(水.motion));
        }
        //if (window.DeviceOrientationEvent) {
        //    水.motion.capabilities.orientation = true;
        //    // We can still listen for deviceorientation events.
        //    // The `absolute` property of the event tells us whether
        //    // or not the degrees are absolute.
        //    window.addEventListener('deviceorientationabsolute', 水.motion.handleOrientationEvent.bind(水.motion));
        //}
        if (window.DeviceMotionEvent) {
            水.motion.capabilities.motion = true;
            //window.addEventListener('devicemotion', function (e) {
            //    水.motion.handleMotionEvent.call(水.motion, e);
            //});
            window.addEventListener('devicemotion', 水.motion.handleMotionEvent.bind(水.motion));
        }
    },
    // TODO: Orientation
    // TODO: Motion
    motion: null,
    icon: null,
    capabilities: {},
    calibration: {},

    // TODO: DeviceOrientationEvent.absolute - this is compass now?
    //On return, absolute is true if the orientation data in instanceOfDeviceOrientationEvent is provided as the difference between the Earth's coordinate frame and the device's coordinate frame, or false if the orientation data is being provided in reference to some arbitrary, device-determined coordinate frame.
    // TODO: DeviceOrientationEvent.alpha
    // TODO: DeviceOrientationEvent.beta
    // TODO: DeviceOrientationEvent.gamma,
    // TODO: Browsers may handle this differently, please test.

    // TODO: DeviceMotionEvent.acceleration - if data is missing here, try IncludingGravity
    // TODO: DeviceMotionEvent.accelerationIncludingGravity
    // TODO: DeviceMotionEvent.interval
    // TODO: DeviceMotionEvent.rotationRate

    renderIcon: function (e) {
        if (!水.motion.icon) {
            var icon = document.createElement('img');
            icon.style.position = 'absolute';
            icon.style.zIndex = 100;
            水.motion.icon = icon;
            document.body.appendChild(水.motion.icon);
            // TODO: Installation specific
            icon.src = '/images/videobleepicon.gif';
        }
        // beta - pitch - is -180 upside-down from pointing forward, 180 upsidedown from tilting back (towards user)
        var posTop = Math.round(((e.beta + 180)/360)*100);
        // gamma - roll - is -90 full to left, 90 full to right; or 0 to 180 corrected
        var posLeft = Math.round(((e.gamma + 90)/180)*100);

        水.motion.icon.style.left = posLeft + '%';
        水.motion.icon.style.top = posTop + '%';

    },
    // DeviceOrientationEvent handler
    handleOrientationEvent: function (e) {
//            if (!calibration) {
//                // This should always be the user pointing towards their desired start point on the screen!
//                // We may be able to have them point to "the front" first, or even run a system calibration to establish where the compass heading is.
//                this.calibration = e;
//            }
        // TODO: Future
        //水.motion.renderIcon(e);

        // TODO: configuration should be handled by the client
        //var plugin = 水.config.channel.plugin;
        //var pluginConfig = 水.config.channel[plugin];

        // degree north
        //var c = e.compassHeading || e.webkitCompassHeading || 0;
        // accuracy in deg
        //var accuracy = e.compassAccuracy || e.webkitCompassAccuracy || 0;

        //alert(水.config.channel.plugin);

        // if we don't have orientation in the plugin, do nothing
        //if (pluginConfig && pluginConfig.orientation) {

            // Fix for #49, prefer webkitCompassHeading if available.
            var correctAlpha = e.alpha;
            if (e.absolute && e.webkitCompassHeading) correctAlpha = e.webkitCompassHeading;

            // invert compass
            //correctAlpha = 360 - correctAlpha;

            // Level the compass if it's not absolute
            //if (!e.absolute) correctAlpha = correctAlpha + 180;

            this.calibration.orientation = e;
            this.calibration.compassHeading = e.webkitCompassHeading;
            this.calibration.correctAlpha = correctAlpha;

            var o = {
                alpha: e.alpha,
                beta: e.beta,
                gamma: e.gamma,
                absolute: e.absolute,
                compass: e.webkitCompassHeading || correctAlpha
            };

            //// set a value to compare to in setInterval closure
            //var timestamp = Date.now();
            //水.motion.timestamp = timestamp;

            水.motion.current = { control: { orientation: o}};


            if (水.motion.onOrientation) 水.motion.onOrientation(o);


            //if (!水.poll) {
            //    水.poll = window.setInterval(function () {
            //        //TODO: If the sway channel changes, we should kill the interval and reset it.
            //
            //        // idle is when the last motion event is the same as current
            //        // set or unset idle timeout and control interval.
            //        if (水.motion.idle((水.motion.last === 水.motion.current))) {
            //            window.clearInterval(水.poll);
            //            return;
            //        }
            //
            //        // for obvious reasons which won't appear obvious later ... this line must come after the check above
            //        水.motion.last = 水.motion.current;
            //
            //        // transform the values only when we want to send them to the server
            //        水.data.transform.transformValues(水.motion.current.control.orientation, pluginConfig.orientation);
            //
            //        水.motion.onOrientation(水.motion.current.control.orientation);
            //
            //        // TODO: Ensure these are wired up
            //        //if (socket) {
            //        //    // console.log('Values: ' + values.alpha  + ' '  + values.beta + ' ' + values.gamma);
            //        //    socket.send(serializeableControl(values.alpha, values.beta, values.gamma));
            //        //} else {
            //        //    水.api.post(水.config.url + 水.config.api.control, 水.motion.current, {});
            //        //}
            //
            //    }, 水.config.user.controlInterval);
            //}
        //}

        if (水.debugPanel) {
            水.renderDebugEvent.call(this, 水.debugPanel, e);
        }
    },
    // DeviceMotionEvent handler
    handleMotionEvent: function (e) {
        this.calibration.motion = e.acceleration || e.accellerationIncludingGravity || {};
        this.calibration.rotation = e.rotationRate || {};
        this.calibration.motionInterval = e.interval || {};

        if (水.debugPanel) {
            水.renderDebugEvent.call(this, 水.debugPanel, e);
        }
    },
    // Consider refactoring this out as a throttle class with idle.
    idle: function (isIdle) {
        // Having problems with idle? return false;
        if (isIdle) {
            if (console) console.log('Starting Idle Countdown');
            // setTimeout for idle expiration
            水.idleTimeout = window.setTimeout(function () {
                if (console) console.log('User is idle, deleting from server.');
                水.api.post(水.config.url + 水.config.api.deleteUser, {}, {});
            }, 水.config.user.idleTimeout);
            return true;
        }
        if (水.idleTimeout) {
            // we are no longer idle, let's remove the idle timeout
            if (console) console.log('User is no longer idle, aborting idle.');
            window.clearTimeout(水.idleTimeout);
        }
        return false;
    }
};
/**
 *
 * Shui Data Library
 * Created by Jim Ankrom on 7/30/2014.
 *
 * Transformation of data
 *
 */
    // TODO: rename all capital-lettered methods and other stuff
var data = 水.data = {

    /**
     * shui.data.transformation - Scale and constrain data to appropriate values
     */
    transform: {
        // transform a value to given scale, based on its ratio within a constraint range.
        scaleValue: function (value, scale, constraints) {
            // We cannot scale without constraints
            if (!constraints) return value;

            var constrainedValue = this.constrainValue(value, constraints);

            if (scale) {
                var absoluteValue = value;
                var ratio = this.ratioValue(constrainedValue, constraints);
                if (ratio != null) {
                    var scaleRange = scale.max - scale.min;
                    var relativeOffset = ratio * scaleRange;
                    absoluteValue = relativeOffset + scale.min;
                }

                return absoluteValue;
            }
            // this MUST return an unaffected value if scale or constraints don't exist
            return constrainedValue;
        },
        // Get the ratio of the value to the size of the constraint range
        ratioValue: function (value, constraints) {
            if (constraints) {
                var rangeSize = constraints.ceiling - constraints.floor;
                var adjustedValue = value - constraints.floor;
                return adjustedValue / rangeSize;
            }
        },
        ratioPolarValue: function (value, constraints) {
            // 1. no crossing possible, value in bounds
            // 2. no crossing possible, value outside bounds
            // 3. crossing possible, value in bounds above 0
            // 4. crossing possible, value in bounds below 0
            // 5. crossing possible, value outside bounds

            // - assume min/max is floor / ceiling
            var max = constraints.ceiling,
                min = constraints.floor,
                maxOffset = 0,
                minOffset = 0;

            if (min > max) {
                // crossing possible within range
                if (value < min) {
                    if (value < max) { // value in bounds above 0
                        max = (max + 360);
                        value = (value + 360);
                    } else {
                        // value out of bounds, assess closeness to min/max
                        maxOffset = value - max;
                        minOffset = min - value;
                    }
                } else {
                    // value must be in bounds here, but max should be +360 for proper ratio
                    max = (max + 360);
                }
            } else {
                // no crossing possible for range. Assess for out of bounds
                if (value > max) {
                    maxOffset = value - max;
                    minOffset = (min + 360) - value; // min is now +360 away
                }
                if (value < min) {
                    maxOffset = value - (max - 360); // max is now -360 away
                    minOffset = min - value;
                }
            }

            if (maxOffset || minOffset) {
                if (maxOffset < minOffset) {
                    // closer to max
                    return 1;
                } else {
                    // closer to min
                    return 0;
                }
            }

            max = max - min;
            value = value - min;

            return value / max;
        },
        // Constrain a value to given thresholds
        constrainValue: function (value, constraints) {
            if (constraints) {
                if (value < constraints.floor) return constraints.floor;
                if (value > constraints.ceiling) return constraints.ceiling;
            }
            return value;
        },
        // Transform (constrain / ratio / scale) all values
        transformValues: function (valueHash, config) {
            var keys = Object.keys(valueHash);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var keyConfig = config[key];
                if (keyConfig) {
                    var scaleConfig = keyConfig.scale || config.scale;
                    var constraintsConfig = keyConfig.constraints || config.constraints || {};
                    var value = valueHash[key] || constraintsConfig.floor || 0; // TODO - create a config value for null?
                    valueHash[key] = this.scaleValue(value, scaleConfig, constraintsConfig);
                } else {
                    //alert("Key not found: " + key);
                }
            }
        }
    },

    rangeObjects: {
        constraints: {
            min: 0,
            max: 1
        },
        interval: .1
    },
    //    var rads = (Math.PI / 180);
    //var sin90 = Math.sin(90 * rads);
    //var screenInstallation = {
    //    heading: 67,
    //    correction: -13, // 0-degree offset from north
    //    size: 120, // inches
    //    calSize: 100
    //};
    //var userHeadings = {
    //    heading1: 317,
    //    heading2: 43
    //};
    triangulate: function (screen, user) {
        var h1 = user.heading1 + screen.correction, // screen correction is the offset from 0 (or 90?)
            h2 = user.heading2 + screen.correction;
        var tri = {
            angleA: h2 - h1,
            angleA1: 360 - h1,
            angleA2: h2
        };
        tri.angleB = 90 - tri.angleA1;
        tri.angleC = 90 - tri.angleA2;

        // Side A is the CALIBRATION TARGET size, not the screen size
        // ie; it is the distance between point A and point B
        // TODO: Uh, this should be in inches, so we'll need to figure out total screen size vs resolution
        tri.sideA = screen.calSize;
        tri.sinA = Math.sin(tri.angleA * rads);
        tri.sinA1 = Math.sin(tri.angleA1 * rads);
        tri.sinA2 = Math.sin(tri.angleA2 * rads);

        tri.ratio = tri.sideA / tri.sinA;
        tri.sinB = Math.sin(tri.angleB * rads);
        tri.sinC = Math.sin(tri.angleC * rads);
        tri.sideB = tri.sinB * tri.ratio;
        tri.sideC = tri.sinC * tri.ratio;

        // now figure out triangle a1 & a2 (maybe don't need a2, since we can figure that out by subtracting a1 from a)

        // D is the inner triangle A1's hypotenuse (side opposite the 90 degree angle)
        tri.ratioD = tri.sideC / sin90;
        tri.sideA1 = tri.sinA1 * tri.ratioD;
        tri.sideA2 = tri.sideA - tri.sideA1;
        tri.sideD = tri.sinB * tri.ratioD;

        return tri;

    },
    Range: function () {
        extend.call(this, data.rangeObjects.constraints);
        extend.call(this, data.rangeObjects);
    },
    LimitedList: function () {
        extend.call(this, data.rangeObjects.constraints);
    },
    Matrix: function () {
        // add to rows, columns
        this.add = function (value) {};
    }
};


/**
 * Created by Jim Ankrom on 2/23/2016.
 */


/*
*
* For each data type, create an observable object that then watches it's values
*
*
* */




/* Shui config needs to look like this:

{ [pluginName]: {
    [inputName]: { // schema def for input data, such as 'orientation'
        ... [other config for plugin, per value]
        [inputValue]: {
            [handler]: { configValues },
            ... [other config for plugin, per value]
        }
    }
}

 // event -> throttle -> transform -> send
Shui should get the data, and pass it into the pipeline. Each handler should know how to act on the data.


  */
// pipeline factory
var pipeline = 水.pipeline = {
    /**
     * Build a constraint handler for the specific inputValue in input
     * @param constraintConfig
     * @returns {Function}
     */

    //buildRatioHandler: function (key, valueConfig) {
    //    var rV = 水.data.transform.ratioValue;
    //    return function (data) {
    //        data[key] = rV(data[key], valueConfig);
    //    };
    //},
    /**
     *
     * Build constraint handlers for all inputValues in input
     * @param inputValueConfig
     * @returns {Array}
     */
    //buildConstraintHandlersForInput: function (inputValueConfig) {
    //    var keys = Object.keys(inputValueConfig);
    //    var constraint,
    //        i,
    //        key,
    //        len = keys.length,
    //        results = [];
    //    // console.log(JSON.stringify(keys));
    //
    //    for (i=0; i<len; i++) {
    //        key = keys[i];
    //        constraint = inputValueConfig[key].constraints;
    //        //console.log('constraint = ' + JSON.stringify(constraint));
    //        if (constraint) {
    //            results.push(
    //                pipeline.buildConstraintHandler(key, constraint)
    //            );
    //        }
    //    }
    //
    //    return results;
    //},

    //buildHandlersForInput: function (plugins, handlerType, inputConfig) {
    //    var valueKeys = Object.keys(inputConfig),
    //        plugin = plugins[handlerType]; // plugin is the handler factory
    //
    //    var valueConfig, // configuration for the overall value
    //        handler, // function to handle the value transform
    //        handlerConfig, // configuration for the handler to use
    //        i,
    //        valueKey, // key to the value in the data
    //        len = valueKeys.length,
    //        results = [];
    //
    //    if (!plugin) return;
    //
    //    // iterate over each value type in the input schema
    //    for (i=0; i<len; i++) {
    //        valueKey = valueKeys[i];
    //        log(valueKey, 'valueKey');
    //        // get the full configuration for the value
    //        valueConfig = inputConfig[valueKey];
    //        // get the configuration for a specific handler (constrain, scale, ratio) for the value
    //        handlerConfig = valueConfig[handlerType];
    //
    //        if (handlerConfig) {
    //            handler = plugin(valueKey, handlerConfig, valueConfig);
    //            if (handler) results.push(handler);
    //        }
    //    }
    //
    //    return results;
    //},
    buildHandlersForInput: function (plugins, handlerType, inputConfig) {

        var valueKeys = Object.keys(inputConfig),
            plugin = plugins[handlerType]; // plugin is the handler factory

        var valueConfig, // configuration for the overall value
            handler, // function to handle the value transform
            handlerConfig, // configuration for the handler to use
            i,
            valueKey, // key to the value in the data
            len = valueKeys.length,
            results = [];

        if (!plugin) return;

        // iterate over each value type in the input schema
        for (i=0; i<len; i++) {
            // TODO: iterate over the plugins
            valueKey = valueKeys[i];
            log(valueKey, 'valueKey');
            // get the full configuration for the value
            valueConfig = inputConfig[valueKey];
            // get the configuration for a specific handler (constrain, scale, ratio) for the value
            handlerConfig = valueConfig[handlerType];

            if (handlerConfig) {
                handler = plugin(valueKey, handlerConfig, valueConfig);
                if (handler) results.push(handler);
            }
        }

        return results;
    }
};


// Plugins have to return a function that accepts data and processes it
pipeline.plugins = (function (transform) {
    return {
        "constraints": function (key, handlerConfig) {
            log('Adding constraint handler');
            var cV = transform.constrainValue;
            return function (data) {
                data[key] = cV(data[key], handlerConfig);
                return data;
            };
        },
        "ratio": function (key, handlerConfig) {
            var rV = transform.ratioValue;
            return function (data) {
                data[key] = rV(data[key], handlerConfig);
                return data;
            };
        },
        "ratioPolar": function (key, handlerConfig, valueConfig) {
            log('Adding polar handler');
            var constraints = valueConfig.ratioPolar;
            var rPV = transform.ratioPolarValue;
            return function (data) {
                data[key] = rPV(data[key], constraints);
                return data;
            };
        },
        "scale": function (key, handlerConfig, valueConfig) {
            log('Adding scale handler');
            var constraints = valueConfig.constraints;
            if (constraints) {
                var scale = valueConfig.scale;
                return function (data) {
                    data[key] = transform.scaleValue(data[key], scale, constraints);
                    return data;
                }
            } else {
                log('No constraints found!', 'Scale Plugin', valueConfig);
            }

        }
    }
})(
    水.data.transform
);

/**
 * Created by cosinezero on 2/23/2016.
 */

})(
    shui,
    cosinedesign.toolbox
);
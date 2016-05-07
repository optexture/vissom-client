var clientState = (function () {
    var sectionList = document.querySelectorAll('section');
    var bypassCalibration = false;

    /**
     * Add `current-state` css class to the declared section of the application, and remove class from all others
     * 
     * @param viewName string
     */
    var changeView = function (viewName) {

            Object.keys(sectionList).forEach(function (key) {
                var currentSection = sectionList[key];

                // add "current-state" class to the selected state
                if (currentSection.id === viewName) {
                    //alert('found view');
                    if (currentSection.classList) {
                        currentSection.classList.add('current-state');
                        //alert('applied class name to list');
                    } else {
                        if (currentSection.className)
                            currentSection.className += ' current-state';
                        else {
                            //alert('applying class name');
                            currentSection.className = 'current-state'
                        }
                    }

                    // ensure none of the other states have "current-state" class applied
                } else {
                    if (currentSection.classList)
                        currentSection.classList.remove('current-state');
                    else if (currentSection.className) currentSection.className = currentSection.className.replace(new RegExp('(^|\\b)' + currentSection.className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                }
            });
    };

    /**
     * called by input slider; sends the new value selected by the user to sway
     */
    var newDotSize = function (event) {
        socket.send(state.channel.name + delimiter + 'size' + delimiter + event.target.value);
    };

    /**
     * matches up index value received from sway and returns the associated shape name. helper function for shapeHandler()
     * 
     * @param id number
     * @returns {string} color name
     */
    var shapeDictionary = function (id) {
        var shapeList = [
            'square',
            'triangle',
            'circle',
            'hexagon',
            'cross',
            'star'
        ];
        
        return shapeList[id];
    };

    /**
     * accepts shape and color information from sway, and updates the ui with the appropriate svg
     * @param shapeIndex value to look up in shape dictionary
     * @param color global var with config info
     */
    var shapeHandler = function (shapeIndex, color) {
        var i;
        var shapeElements = document.querySelectorAll('.shape');
        var svgns = 'http://www.w3.org/2000/svg';
        var xlinkns = 'http://www.w3.org/1999/xlink';
        var shapeName = shapeDictionary(shapeIndex);

        for (i = 0; i < shapeElements.length; i++) {
            var use = document.createElementNS(svgns, 'use');
            use.setAttributeNS(xlinkns, 'href', 'vissom-shapes.svg#' + shapeName);
            shapeElements[i].appendChild(use);
            shapeElements[i].style.stroke = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
        }
    };

    /**
     * apply event handlers to "paint" button to provide visual feedback for the user
     */
    var pressEvents = function () {
        var button = document.getElementById('paintButton');
        var timer;

        var touchStart = function (e) {
            e.preventDefault();
            timer = window.setTimeout(function () {}, 400);
            this.classList.add('active');
            if (clientState.onPaintStart) clientState.onPaintStart();
        };

        var touchEnd = function () {
            clearTimeout(timer);
            this.classList.remove('active');
            if (clientState.onPaintEnd) clientState.onPaintEnd();
        };

        button.addEventListener('mousedown', touchStart, false);
        button.addEventListener('touchstart', touchStart, false);

        button.addEventListener('mouseup', touchEnd, false);
        button.addEventListener('touchend', touchEnd, false);
    };

    return {
        changeView: changeView,
        shapeHandler: shapeHandler,
        newDotSize: newDotSize,
        pressEvents: pressEvents,
        bypassCalibration: bypassCalibration,
        onPaintStart: null,
        onPaintEnd: null
    }
})();

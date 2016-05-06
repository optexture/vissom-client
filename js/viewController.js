var clientState = (function () {
    var sectionList = document.querySelectorAll('section');

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
    
    var shapeHandler = function (shape, color) {
        var i;
        var shapeElements = document.querySelectorAll('.shape');
        var svgns = 'http://www.w3.org/2000/svg';
        var xlinkns = 'http://www.w3.org/1999/xlink';

        for (i = 0; i < shapeElements.length; i++) {
            var use = document.createElementNS(svgns, 'use');
            use.setAttributeNS(xlinkns, 'href', 'vissom-shapes.svg#' + shape);
            shapeElements[i].appendChild(use);
            shapeElements[i].style.fill = color;
        }
    };

    return {
        changeView: changeView,
        shapeHandler: shapeHandler
    }
})();

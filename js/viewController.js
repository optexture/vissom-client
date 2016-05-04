var clientState = (function () {
    var sectionList = document.querySelectorAll('section');

    var calibrationSteps = {
        step1: document.getElementById('calibrate1'),
        step2: document.getElementById('calibrate2'),
        step3: document.getElementById('calibrate3')
    };

    var calibrationCurrentStep = 'step1';

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
                if (currentSection.classList) {
                    currentSection.classList.add('current-state');
                } else {
                    currentSection.className += ' current-state';
                }

            // ensure none of the other states have "current-state" class applied
            } else {
                if (currentSection.classList)
                    currentSection.classList.remove('current-state');
                else
                    currentSection.className = currentSection.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        });
    };

    /**
     * Click handler - walk user through calibration steps
     */
    var userCalibration = function () {

        if (calibrationCurrentStep === 'step1') {

            calibrationSteps.step1.classList.remove('current-step');
            calibrationSteps.step2.classList.add('current-step');

            calibrationCurrentStep = 'step2';

        } else if (calibrationCurrentStep === 'step2') {

            calibrationSteps.step2.classList.remove('current-step');
            calibrationSteps.step3.classList.add('current-step');

            calibrationCurrentStep = 'step3';

        } else if (calibrationCurrentStep === 'step3') {

            changeView('confirm');

            calibrationSteps.step3.classList.remove('current-step');
            calibrationSteps.step1.classList.add('current-step');

            sway.actions.calibrateComplete();
            
            calibrationCurrentStep = 'step1';
        }

    };

    return {
        changeView: changeView,
        userCalibration: userCalibration
    }
})();


var apiUrl = 'https://dataspacedev.home.ubix.io/pub/signal'

var INITIAL_WAIT = 3000;
var INTERVAL_WAIT = 10000;
var ONE_SECOND = 1000;
window.dataLayer = window.dataLayer || [];

var events = [
    "mouseup",
    "keydown",
    "scroll",
    "mousemove"
];
var startTime = Date.now();
var endTime = startTime + INITIAL_WAIT;
var totalTime = 0;
var buttonClicks = {
    total: 0,
};
var buttonClickCount = 0;
var keypressCount = 0;
var scrollCount = 0;
var mouseMovementCount = 0;
var linkClickCount = 0;

/** Variables for click counts */
var total_click_count = 0;
var rage_click_count = 0;
var consecutive_click_count = 0;
var excessive_click_count = 0;
var bottom_page_visit_count = 0;

/** Threshold frequency */
var RAGE_CLICK_THRESHOLD = 750, CONSECUTIVE_THRESHOLD = 5000, EXCESSIVE_THRESHOLD = 10000

/** Count limits for clicks */
var RAGE_CLICK_LIMIT = 4, CONSECUTIVE_CLICK_LIMIT = 5, EXCESSIVE_CLICK_LIMIT = 10

var clickTimestamp = []
var rage_counter = 0, consecutive_counter = 0, scroll_counter = 0;

var pageUrl = window.location.href;
var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
var screenHeight = window.screen.availHeight
var screenWidth = window.screen.availWidth
var os_version = window.navigator.platform
var browser_full_version = parseFloat(window.navigator.appVersion)
var browser_major_version = parseInt(navigator.appVersion)
var screenOrientation = screen.orientation.type
var deviceType = window.navigator.userAgentData.mobile ? "Mobile" : "Desktop";

function getBrowserName() {
    let userAgent = navigator.userAgent;
    let browserName;

    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "opera";
    } else if (userAgent.match(/edg/i)) {
        browserName = "edge";
    } else {
        browserName = "unknown";
    }
    return browserName;
}


function sendSignalData(signal_event) {
    try {
        var signalData = {
            event: signal_event,
            url: pageUrl,
            timeZone: timezone,
            sessionId: window['sessionId'],
            timeStamp: new Date().getTime(),
            screenHeight: screenHeight,
            screenWidth: screenWidth,
            os_version: os_version,
            browser: getBrowserName(),
            browser_full_version: browser_full_version,
            browser_major_version: browser_major_version,
            screenOrientation: screenOrientation,
            deviceType: deviceType
        }
        console.log("Sending signal...", signalData)
        // fetch(apiUrl, {
        //     method: 'POST',
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify(signalData),
        // }).then(function (response) {
        //     console.log("Signal submitted!")
        //     response.text();
        // }).catch(function (error) { console.log("Error", error) })

    } catch (error) {
        console.log(error)
    }
}

ubixConfig('3778925')

events.forEach(function (e) {
    document.addEventListener(e, function () {
        if (e == "mouseup") {
            total_click_count++; rage_counter++; consecutive_counter++;

            var currentTimestamp = new Date().getTime()
            clickTimestamp.push(currentTimestamp)

            //console.log("diff", clickTimestamp[RAGE_CLICK_LIMIT], clickTimestamp[0], clickTimestamp[RAGE_CLICK_LIMIT] - clickTimestamp[0])
            /** Condition for Rage Click */
            if (rage_counter >= RAGE_CLICK_LIMIT && (clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0]) < RAGE_CLICK_THRESHOLD) {
                console.log("Rage Signal..", rage_counter, clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0])
                rage_click_count++;
                rage_counter = 0;
                //document.getElementById('signal_rage_click').innerHTML = rage_click_count

                sendSignalData('rage_click_signal')
            }

            /** Condition for Consecutive Click */
            if (consecutive_counter >= CONSECUTIVE_CLICK_LIMIT && (clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < CONSECUTIVE_THRESHOLD) {
                console.log("Consecutive Signal..", consecutive_counter, clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0])
                consecutive_click_count++;
                consecutive_counter = 0;
                // document.getElementById('signal_consecutive_click').innerHTML = consecutive_click_count;

                sendSignalData('consecutive_click_signal')
            }

            /** Condition for Excessive Click */
            if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT && (clickTimestamp[EXCESSIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < EXCESSIVE_THRESHOLD) {
                console.log("excessive")
                excessive_click_count++;
                clickTimestamp = [];
                //document.getElementById('signal_excessive_click').innerHTML = excessive_click_count;

                sendSignalData('excessive_click_signal')
            }

            /** Condtion to empty the timestamp array */
            if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT) {
                clickTimestamp = [];
            }
        }
        if (e === 'scroll') {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                bottom_page_visit_count++;
                if (bottom_page_visit_count > 2) {
                    bottom_page_visit_count = 0;
                    scroll_counter++;
                    document.getElementById('repeated_scroll').innerHTML = scroll_counter;
                    sendSignalData('repeated_scroll')
                }
            }
        }
    })
})

function ubixConfig(id) {
    window['sessionId'] = id
}


function formatTime(ms) {
    return Math.floor(ms / 1000);
}
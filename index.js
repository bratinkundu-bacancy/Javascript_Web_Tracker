const ONE_SECOND = 1000; INITIAL_WAIT = 3000; INTERVAL_WAIT = 10000;

const events = [
    "mouseup",
    "keydown",
    "scroll",
    "mousemove"
];
let startTime = Date.now();
let endTime = startTime + INITIAL_WAIT;
let totalTime = 0;

/** Variables for click counts */
let total_click_count = 0;
let rage_click_count = 0;
let consecutive_click_count = 0;
let excessive_click_count = 0;
let bottom_page_visit_count = 0;

/** Threshold frequency */
const RAGE_CLICK_THRESHOLD = 750, CONSECUTIVE_THRESHOLD = 5000, EXCESSIVE_THRESHOLD = 10000

/** Count limits for clicks */
const RAGE_CLICK_LIMIT = 4, CONSECUTIVE_CLICK_LIMIT = 5, EXCESSIVE_CLICK_LIMIT = 10

let clickTimestamp = []
let rage_counter = 0, consecutive_counter = 0, scroll_counter = 0

setInterval(function () {
    if (!document.hidden && startTime <= endTime) {
        startTime = Date.now();
        totalTime += ONE_SECOND;
        document.getElementById("timer").innerHTML = formatTime(totalTime);
    }
}, ONE_SECOND);

ubixConfig('3778925')

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

    } catch (error) {
        console.log(error)
    }
}


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("page").innerHTML = pageUrl;
    document.getElementById("tz").innerHTML = timezone;
    /** Show the values in the HTML */
    document.getElementById("screen_height").innerHTML = screenHeight;
    document.getElementById("screen_width").innerHTML = screenWidth;
    document.getElementById("os_version").innerHTML = os_version;
    document.getElementById("screenOrientation").innerHTML = screenOrientation;
    document.getElementById("deviceType").innerHTML = deviceType;
    document.getElementById("browser_full_version").innerHTML = browser_full_version;
    document.getElementById("browser_name").innerHTML = getBrowserName()

    events.forEach(function (e) {
        document.addEventListener(e, function () {
            endTime = Date.now() + INTERVAL_WAIT;
            if (e === 'mouseup') {
                total_click_count++; rage_counter++; consecutive_counter++;

                const currentTimestamp = new Date().getTime()
                clickTimestamp.push(currentTimestamp)

                /** Condition for Rage Click */
                if (rage_counter >= RAGE_CLICK_LIMIT && (clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0]) < RAGE_CLICK_THRESHOLD) {
                    //console.log("Rage Signal..", rage_counter, clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0])
                    rage_click_count++;
                    rage_counter = 0;
                    document.getElementById('signal_rage_click').innerHTML = rage_click_count
                    sendSignalData('rage_click_signal')
                }

                /** Condition for Consecutive Click */
                if (consecutive_counter >= CONSECUTIVE_CLICK_LIMIT && (clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < CONSECUTIVE_THRESHOLD) {
                    //console.log("Consecutive Signal..", consecutive_counter, clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0])
                    consecutive_click_count++;
                    consecutive_counter = 0;
                    document.getElementById('signal_consecutive_click').innerHTML = consecutive_click_count;
                    sendSignalData('consecutive_click_signal')
                }

                /** Condition for Excessive Click */
                if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT && (clickTimestamp[EXCESSIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < EXCESSIVE_THRESHOLD) {
                    //console.log("excessive")
                    excessive_click_count++;
                    clickTimestamp = [];
                    document.getElementById('signal_excessive_click').innerHTML = excessive_click_count;
                    sendSignalData('excessive_click_signal')
                }

                /** Condtion to empty the timestamp array */
                if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT) {
                    clickTimestamp = [];
                }

                document.getElementById("click").innerHTML = total_click_count
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
        });
    });
});

function ubixConfig(id) {
    window['sessionId'] = id
}



function formatTime(ms) {
    return Math.floor(ms / 1000);
}


// Browser version, OS version, screen resolution, Major & minor version of browser, mobile version (portrait/landscape), deviceType (mobile)
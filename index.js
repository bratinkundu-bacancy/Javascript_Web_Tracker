var apiUrl = 'https://ds-contentsquare.home.ubix.io/api/real-time-collect'
const ONE_SECOND = 1000; INITIAL_WAIT = 3000; INTERVAL_WAIT = 10000;

const events = [
    "mouseup",
    "keydown",
    "scroll",
    "mousemove",
    "mouseleave",
    "error",
    "click",
    "paste",
    "load",
    "touchstart",
    "touchend",
    "touchmove",
    "mouseover"
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

/** New Adds */
var total_paste = 0;
var total_reloads = 0;
var lastMouseX = null;
var lastMouseY = null;
var interval = 350, threshold = 0.01;
var velocity;
var direction;
var directionChangeCount = 0;
var distance = 0;

/** Threshold frequency */
const RAGE_CLICK_THRESHOLD = 750, CONSECUTIVE_THRESHOLD = 5000, EXCESSIVE_THRESHOLD = 10000

/** Count limits for clicks */
const RAGE_CLICK_LIMIT = 4, CONSECUTIVE_CLICK_LIMIT = 5, EXCESSIVE_CLICK_LIMIT = 10, PASTE_LIMIT = 2, RELOAD_LIMIT = 2, SHAKE_THRESHOLD = 50, ZOOM_THRESHOLD = 30

let clickTimestamp = []
let rage_counter = 0, consecutive_counter = 0, scroll_counter = 0

setInterval(function () {
    if (!document.hidden && startTime <= endTime) {
        startTime = Date.now();
        totalTime += ONE_SECOND;
        document.getElementById("timer").innerHTML = formatTime(totalTime);
    }
}, ONE_SECOND);


var pageUrl = window.location.href;
var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
var screenHeight = window.screen.availHeight
var screenWidth = window.screen.availWidth
var os_version = window.navigator.platform
var browser_full_version = parseFloat(window.navigator.appVersion)
var browser_major_version = parseInt(navigator.appVersion)
var screenOrientation = screen.orientation.type
var mobileKeywords = ["mobile", "android", "iphone", "ipod", "ipad", "windows phone"];
var isMobile = mobileKeywords.some(keyword => navigator.userAgent.toLowerCase().includes(keyword));
var deviceType = isMobile ? "Mobile" : "Desktop";
var device_fingerprint = ''
generateDeviceFingerprint().then(fg => { device_fingerprint = fg })

var pageTitle = ''
var pageLoadTime = 0
var fist_contentful_paint = 0
/** New Adds */
var initialZoomDistance = null
var xpath = ''

var hoverCounts = {
    buttons: 0,
    links: 0,
    input: 0,
}


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
            fingerprint: device_fingerprint,
            userTimeStamp: new Date().toISOString(),
            screenHeight: screenHeight,
            screenWidth: screenWidth,
            os_version: os_version,
            browser: getBrowserName(),
            browser_full_version: browser_full_version,
            browser_major_version: browser_major_version,
            screenOrientation: screenOrientation,
            deviceType: deviceType,
            source: window.location.hostname,
            referrer: document.referrer !== '' & window.location.href !== document.referrer ? document.referrer : '',
            /** New fields addition */
            pageTitle: pageTitle,
            pageLoadTime: signal_event === 'excessive_reloads' || 'page_entry' ? pageLoadTime : 0,
            fisrtPaint: signal_event === 'excessive_reloads' || 'page_entry' ? fist_contentful_paint : 0,
            xpath: signal_event.includes('click') || signal_event.includes('hover') ? xpath : ''
        }

        var apiRequestBody = {
            tableName: "MarketingTag",
            data: [signalData],
            clientInfo: {
                appKey: "dataSpace",
                accessToken: "dataSpace@ubix.com",
                timeStamp: new Date().getTime()
            }
        }

        console.log(`Sending signal... ${signal_event}`, apiRequestBody)

        // fetch(apiUrl, {
        //     method: 'POST',
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify(apiRequestBody),
        // }).then(function (response) {
        //     console.log("Signal submitted!", response)
        //     console.log(response.json());
        // })
        //     .catch(function (error) { console.log("Error", error) })

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
    document.getElementById("fingerprint").innerHTML = device_fingerprint;
    pageTitle = document.title

    events.forEach(function (e) {
        window.addEventListener(e, function (event) {
            endTime = Date.now() + INTERVAL_WAIT;
            if (e === 'click') {
                total_click_count++; rage_counter++; consecutive_counter++;

                const currentTimestamp = new Date().getTime()
                clickTimestamp.push(currentTimestamp)

                /** Condition for Rage Click */
                if (rage_counter >= RAGE_CLICK_LIMIT && (clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0]) < RAGE_CLICK_THRESHOLD) {
                    //console.log("Rage Signal..", rage_counter, clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0])
                    rage_click_count++;
                    rage_counter = 0;
                    document.getElementById('signal_rage_click').innerHTML = rage_click_count
                    xpath = getXPath(event.target)
                    console.log(xpath)
                    sendSignalData('frustrated_click')
                }

                /** Condition for Consecutive Click */
                if (consecutive_counter >= CONSECUTIVE_CLICK_LIMIT && (clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < CONSECUTIVE_THRESHOLD) {
                    //console.log("Consecutive Signal..", consecutive_counter, clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0])
                    consecutive_click_count++;
                    consecutive_counter = 0;
                    document.getElementById('signal_consecutive_click').innerHTML = consecutive_click_count;
                    xpath = getXPath(event.target)
                    console.log(xpath)
                    sendSignalData('consecutive_click')
                }

                /** Condition for Excessive Click */
                if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT && (clickTimestamp[EXCESSIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < EXCESSIVE_THRESHOLD) {
                    //console.log("excessive")
                    excessive_click_count++;
                    clickTimestamp = [];
                    document.getElementById('signal_excessive_click').innerHTML = excessive_click_count;
                    xpath = getXPath(event.target)
                    console.log(xpath)
                    sendSignalData('excessive_clicks')
                }

                /** Condtion to empty the timestamp array */
                if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT) {
                    clickTimestamp = [];
                }

                document.getElementById("click").innerHTML = total_click_count
            }
            if (e === 'load') {
                if (window.performance.getEntriesByName('first-contentful-paint').length > 0) {
                    fist_contentful_paint = window.performance.getEntriesByName('first-contentful-paint')[0].startTime;
                }
                if (window.performance.getEntriesByType("navigation")[0].type === 'reload') {
                    pageLoadTime = window.performance.timing.domComplete - window.performance.timing.navigationStart
                    sendSignalData('excessive_reloads')
                }
                else {
                    pageLoadTime = window.performance.timing.domComplete - window.performance.timing.navigationStart
                    sendSignalData('page_entry')
                }

            }
            if (e === 'scroll') {
                if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
                    bottom_page_visit_count++;
                    if (bottom_page_visit_count > 2) {
                        bottom_page_visit_count = 0;
                        scroll_counter++;
                        document.getElementById('repeated_scroll').innerHTML = scroll_counter;
                        sendSignalData('repeated_scrolling')
                    }
                }
            }
            if (e === 'error') {
                sendSignalData('js_error')
            }
            if (e === 'paste') {
                total_paste++;
                if (total_paste > PASTE_LIMIT) {
                    sendSignalData('excessive_pastes');
                }
            }
            if (e === "mousemove") {
                var nextDirection = Math.sign(event.movementX);
                distance += Math.abs(event.movementX) + Math.abs(event.movementY);
                if (nextDirection !== direction) {
                    direction = nextDirection;
                    directionChangeCount++
                }
            }
            /** New Adds */
            if (e === 'touchstart') {
                if (event.touches.length === 2) {
                    var touch1 = event.touches[0];
                    var touch2 = event.touches[1];
                    initialZoomDistance = distanceBetweenTouches(touch1, touch2);
                }
            }
            if (e === 'touchend') {
                initialZoomDistance = null
            }
            if (e === 'touchmove') {
                if (event.touches.length === 2 && initialZoomDistance !== null) {
                    var touch1 = event.touches[0];
                    var touch2 = event.touches[1];
                    var currentDistance = distanceBetweenTouches(touch1, touch2);

                    var delta = Math.abs(currentDistance - initialZoomDistance);
                    //delta > ZOOM_THRESHOLD && initialZoomDistance > currentDistance ? console.log(initialZoomDistance, currentDistance) : console.log(delta)
                    if (delta > ZOOM_THRESHOLD) {
                        sendSignalData('pinch_and_zoom');
                        initialZoomDistance = null

                    }
                }
            }
            if (e === 'mouseover') {
                var htmlTag = event.target.tagName.toLowerCase()

                if (htmlTag == 'button') {
                    hoverCounts.buttons++
                    if (hoverCounts.buttons > 2) {
                        xpath = getXPath(event.target)
                        hoverCounts.buttons = 0
                        sendSignalData('repetitive_hovering')
                    }
                }
                if (htmlTag === 'a') {
                    hoverCounts.links++
                    if (hoverCounts.links > 2) {
                        xpath = getXPath(event.target)
                        hoverCounts.links = 0
                        sendSignalData('repetitive_hovering')
                    }
                }
                if (htmlTag === 'input') {
                    hoverCounts.input++
                    if (hoverCounts.input > 2) {
                        xpath = getXPath(event.target)
                        hoverCounts.input = 0
                        sendSignalData('repetitive_hovering')
                    }
                }
                //console.log(htmlTag)
            }
        });
    });
});


function formatTime(ms) {
    return Math.floor(ms / 1000);
}

function throwError() {
    throw new Error("Emiting error signal..")
}

// Browser version, OS version, screen resolution, Major & minor version of browser, mobile version (portrait/landscape), deviceType (mobile)

function generateDeviceFingerprint() {

    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const colorDepth = window.screen.colorDepth;
    const deviceMemory = navigator.deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;
    const platform = os_version;
    const plugins = getPlugins();
    const canvasFingerprint = generateCanvasFingerprint();
    const webglFingerprint = generateWebGLFingerprint();

    // Hash the collected data using a hashing algorithm
    const dataToHash = `${userAgent}${language}${colorDepth}${deviceMemory}${hardwareConcurrency}${platform}${plugins}${canvasFingerprint}${webglFingerprint}`;
    const hashedData = sha256(dataToHash);

    return hashedData
}

// Get a list of installed plugins
function getPlugins() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
    }
    return plugins.join(',');
}

// Generate a canvas fingerprint
function generateCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    const fingerprint = `${gl.getParameter(gl.VENDOR)}~${gl.getParameter(gl.RENDERER)}~${extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : ''}`;
    return fingerprint;
}

// Generate a WebGL fingerprint
function generateWebGLFingerprint() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const fingerprint = gl.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_VENDOR_WEBGL) : '';
    return fingerprint;
}

// SHA-256 hashing function
function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', buffer).then(hash => {
        return hex(hash);
    });
}

// Convert binary hash to hex string
function hex(buffer) {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
        const value = view.getUint32(i);
        const stringValue = value.toString(16);
        const padding = '00000000';
        const paddedValue = (padding + stringValue).slice(-padding.length);
        hexCodes.push(paddedValue);
    }
    return hexCodes.join('');
}

// Calculate distance between two touches
function distanceBetweenTouches(t1, t2) {
    var dx = t2.clientX - t1.clientX;
    var dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}


// Calculate XPath of the element
function getXPath(element) {
    if (element && element.parentNode) {
        var xpath = getXPath(element.parentNode) + '/' + element.tagName.toLowerCase();
        var index = getChildIndex(element);
        if (index > 1) {
            xpath += '[' + index + ']';
        }
        return xpath;
    } else {
        return '';
    }
}


function getChildIndex(element) {
    var index = 1;
    var sibling = element.previousElementSibling;
    while (sibling) {
        if (sibling.tagName === element.tagName) {
            index++;
        }
        sibling = sibling.previousElementSibling;
    }
    return index;
}

var intervalClear = setInterval((function () {
    var nextVelocity = distance / interval;
    if (!velocity) { velocity = nextVelocity; return }
    var acceleration = (nextVelocity - velocity) / interval;
    if (directionChangeCount && acceleration > threshold) {
        sendSignalData("mouse_shakes")
    } distance = 0; directionChangeCount = 0; velocity = nextVelocity
}), interval);
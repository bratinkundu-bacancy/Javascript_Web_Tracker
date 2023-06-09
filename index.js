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
    "load"
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
const RAGE_CLICK_LIMIT = 4, CONSECUTIVE_CLICK_LIMIT = 5, EXCESSIVE_CLICK_LIMIT = 10, PASTE_LIMIT = 2, RELOAD_LIMIT = 2, SHAKE_THRESHOLD = 50

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

/** New Adds */
var pageTitle = ''
var pageLoadTime = 0
var fist_contentful_paint = 0

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
            userTimeStamp: new Date().getTime(),
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
            pageLoadTime: signal_event === 'excessive_reloads' ? pageLoadTime : 0,
            fisrtPaint: signal_event === 'excessive_reloads' ? fist_contentful_paint : 0
        }

        var apiRequestBody = {
            tableName: "LiveSignal",
            data: [signalData],
            clientInfo: {
                appKey: "dataSpace",
                accessToken: "c8358a11b164860333a64794b54eadca",
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
                    sendSignalData('frustrated_click')
                }

                /** Condition for Consecutive Click */
                if (consecutive_counter >= CONSECUTIVE_CLICK_LIMIT && (clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < CONSECUTIVE_THRESHOLD) {
                    //console.log("Consecutive Signal..", consecutive_counter, clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0])
                    consecutive_click_count++;
                    consecutive_counter = 0;
                    document.getElementById('signal_consecutive_click').innerHTML = consecutive_click_count;
                    sendSignalData('consecutive_click')
                }

                /** Condition for Excessive Click */
                if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT && (clickTimestamp[EXCESSIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < EXCESSIVE_THRESHOLD) {
                    //console.log("excessive")
                    excessive_click_count++;
                    clickTimestamp = [];
                    document.getElementById('signal_excessive_click').innerHTML = excessive_click_count;
                    sendSignalData('excessive_clicks')
                }

                /** Condtion to empty the timestamp array */
                if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT) {
                    clickTimestamp = [];
                }

                document.getElementById("click").innerHTML = total_click_count
            }
            if (e === 'load') {
                pageLoadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
                if (window.performance.getEntriesByName('first-contentful-paint').length > 0) {
                    fist_contentful_paint = window.performance.getEntriesByName('first-contentful-paint')[0].startTime;
                }
                console.log(fist_contentful_paint, pageLoadTime)
                if (window.performance.getEntriesByType("navigation")[0].type === 'reload') {
                    sendSignalData('excessive_reloads')
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
            /** New Adds */
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


var intervalClear = setInterval((function () {
    var nextVelocity = distance / interval;
    if (!velocity) { velocity = nextVelocity; return }
    var acceleration = (nextVelocity - velocity) / interval;
    if (directionChangeCount && acceleration > threshold) {
        sendSignalData("mouse_shakes")
    } distance = 0; directionChangeCount = 0; velocity = nextVelocity
}), interval);
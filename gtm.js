var apiUrl = 'https://ubix-data-collector.home.ubix.io/api/real-time-collect'

var INITIAL_WAIT = 3000;
var INTERVAL_WAIT = 10000;
var ONE_SECOND = 1000;

var tableName = window.tn || 'marketingtag';

var events = [
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
var startTime = Date.now();
var endTime = startTime + INITIAL_WAIT;
var totalTime = 0;


/** Variables for click counts */
var total_click_count = 0;
var rage_click_count = 0;
var consecutive_click_count = 0;
var excessive_click_count = 0;
var bottom_page_visit_count = 0;
var total_paste = 0;
var total_reloads = 0;
var lastMouseX = null;
var lastMouseY = null;
var interval = 350, threshold = 0.01;
var velocity;
var direction;
var directionChangeCount = 0;
var distance = 0;
var pageLoadTime = 0
var fist_contentful_paint = 0
var initialZoomDistance = null
var xpath = ''

var hoverCounts = {
    buttons: 0,
    links: 0,
    input: 0,
}


/** Threshold frequency */
var RAGE_CLICK_THRESHOLD = 750, CONSECUTIVE_THRESHOLD = 5000, EXCESSIVE_THRESHOLD = 10000

/** Count limits for clicks */
var RAGE_CLICK_LIMIT = 4, CONSECUTIVE_CLICK_LIMIT = 5, EXCESSIVE_CLICK_LIMIT = 10, PASTE_LIMIT = 2, RELOAD_LIMIT = 2, SHAKE_THRESHOLD = 50, ZOOM_THRESHOLD = 50

var clickTimestamp = []
var rage_counter = 0, consecutive_counter = 0, scroll_counter = 0;

var pageUrl = window.location.href;
var timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
var screenHeight = window.screen.availHeight
var screenWidth = window.screen.availWidth
var os_version = window.navigator.platform
var browser_full_version = ''
var browser_major_version = ''
var screenOrientation = screen.orientation.type
var mobileKeywords = ["mobile", "android", "iphone", "ipod", "ipad", "windows phone"];
var userAgent = navigator.userAgent.toLowerCase();
var isMobile = mobileKeywords.some(function (keyword) { userAgent.includes(keyword) });
var deviceType = isMobile ? "Mobile" : "Desktop";
var device_fingerprint = ''
generateDeviceFingerprint().then(function (fg) { device_fingerprint = fg })


function getBrowserName() {
    var userAgent = navigator.userAgent;
    var browserName;

    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "Chrome";
        browser_full_version = browserName +' '+ navigator.userAgent.split('Chrome/')[1].split(' ')[0]
        browser_major_version = navigator.userAgent.split('Chrome/')[1].split(' ')[0].split('.')[0]
        
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "Firefox";
        browser_full_version = browserName +' '+ navigator.userAgent.split('Firefox/')[1].split(' ')[0]
        browser_major_version = navigator.userAgent.split('Firefox/')[1].split(' ')[0].split('.')[0]
    
    } else if (userAgent.match(/safari/i)) {
        browserName = "Safari";
        browser_full_version = browserName +' '+ navigator.userAgent.split('Safari/')[1].split(' ')[0]
        browser_major_version = navigator.userAgent.split('Safari/')[1].split(' ')[0].split('.')[0]
        
    } else if (userAgent.match(/opr\//i)) {
        browserName = "Opera";
        browser_full_version = browserName +' '+ navigator.userAgent.split('OPR/')[1].split(' ')[0]
        browser_major_version = navigator.userAgent.split('OPR/')[1].split(' ')[0].split('.')[0]
        
    } else if (userAgent.match(/edg/i)) {
        browserName = "Edge";
        browser_full_version = browserName +' '+ navigator.userAgent.split('Edg/')[1].split(' ')[0]
        browser_major_version = navigator.userAgent.split('Edg/')[1].split(' ')[0].split('.')[0]
        
    } else {
        browserName = "unknown";
    }
    return browserName;
}


function sendSignalData(signal_event) {
    var brName = getBrowserName();
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
            browser: brName,
            browser_full_version: browser_full_version,
            browser_major_version: browser_major_version,
            screenOrientation: screenOrientation,
            deviceType: deviceType,
            source: window.location.hostname,
            referrer: document.referrer !== '' & window.location.href !== document.referrer ? document.referrer : '',
            /** New fields addition */
            pageTitle: document.title,
            pageLoadTime: signal_event === ('excessive_reloads' || 'page_entry') ? pageLoadTime : 0,
            fisrtPaint: signal_event === ('excessive_reloads' || 'page_entry') ? fist_contentful_paint : 0,
            xpath: signal_event.includes('click') || signal_event.includes('hover') ? xpath : ''

        }

        var apiRequestBody = {
            tableName: tableName,
            data: [signalData],
            clientInfo: {
                appKey: "dataSpace",
                accessToken: "dataSpace@ubix.com",
                timeStamp: new Date().getTime()
            }
        }

        console.log('Sending signal...', signal_event, apiRequestBody)

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(apiRequestBody),
        }).then(function (response) {
            console.log("Signal submitted!", response)
            console.log(response.json());
        })
            .catch(function (error) { console.log("Error", error) })

    } catch (error) {
        console.log(error)
    }
}

events.forEach(function (e) {
    window.addEventListener(e, function (event) {
        if (e == 'click') {
            total_click_count++; rage_counter++; consecutive_counter++;

            var currentTimestamp = new Date().getTime()
            clickTimestamp.push(currentTimestamp)

            //console.log("diff", clickTimestamp[RAGE_CLICK_LIMIT], clickTimestamp[0], clickTimestamp[RAGE_CLICK_LIMIT] - clickTimestamp[0])
            /** Condition for Rage Click */
            if (rage_counter >= RAGE_CLICK_LIMIT && (clickTimestamp[RAGE_CLICK_LIMIT - 1] - clickTimestamp[0]) < RAGE_CLICK_THRESHOLD) {

                rage_click_count++;
                rage_counter = 0;
                //document.getElementById('signal_rage_click').innerHTML = rage_click_count
                xpath = getXPath(event.target)
                sendSignalData('frustrated_click')
            }

            /** Condition for Consecutive Click */
            if (consecutive_counter >= CONSECUTIVE_CLICK_LIMIT && (clickTimestamp[CONSECUTIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < CONSECUTIVE_THRESHOLD) {
                consecutive_click_count++;
                consecutive_counter = 0;
                xpath = getXPath(event.target)
                sendSignalData('consecutive_click')
            }

            /** Condition for Excessive Click */
            if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT && (clickTimestamp[EXCESSIVE_CLICK_LIMIT - 1] - clickTimestamp[0]) < EXCESSIVE_THRESHOLD) {
                excessive_click_count++;
                clickTimestamp = [];
                xpath = getXPath(event.target)
                sendSignalData('excessive_clicks')
            }

            /** Condtion to empty the timestamp array */
            if (clickTimestamp.length === EXCESSIVE_CLICK_LIMIT) {
                clickTimestamp = [];
            }
        }
        if (e === 'load') {
            console.log("reloading...")
            if (window.performance.getEntriesByName('first-contentful-paint').length > 0) {
                fist_contentful_paint = window.performance.getEntriesByName('first-contentful-paint')[0].startTime;
            }
            if (window.performance.getEntriesByType("navigation")[0].type === 'reload') {
                pageLoadTime = window.performance.timing.domComplete - window.performance.timing.navigationStart
                sendSignalData('excessive_reloads')
            } else {
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
                    //document.getElementById('repeated_scroll').innerHTML = scroll_counter;
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
    })
})

function formatTime(ms) {
    return Math.floor(ms / 1000);
}


function generateDeviceFingerprint() {

    var userAgent = navigator.userAgent;
    var language = navigator.language;
    var colorDepth = window.screen.colorDepth;
    var deviceMemory = navigator.deviceMemory;
    var hardwareConcurrency = navigator.hardwareConcurrency;
    var platform = os_version;
    var plugins = getPlugins();
    var canvasFingerprint = generateCanvasFingerprint();
    var webglFingerprint = generateWebGLFingerprint();

    // Hash the collected data using a hashing algorithm
    var dataToHash = userAgent + language + colorDepth + deviceMemory + hardwareConcurrency + platform + plugins + canvasFingerprint + webglFingerprint;
    var hashedData = sha256(dataToHash);

    return hashedData
}

// Get a list of installed plugins
function getPlugins() {
    var plugins = [];
    for (var i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
    }
    return plugins.join(',');
}

// Generate a canvas fingerprint
function generateCanvasFingerprint() {
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    var extension = gl.getExtension('WEBGL_debug_renderer_info');
    var ext = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : ''
    var fingerprint = gl.getParameter(gl.VENDOR) + '~' + gl.getParameter(gl.RENDERER) + '~' + ext;
    return fingerprint;
}

// Generate a WebGL fingerprint
function generateWebGLFingerprint() {
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    var fingerprint = gl.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_VENDOR_WEBGL) : '';
    return fingerprint;
}

// SHA-256 hashing function
function sha256(str) {
    var buffer = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', buffer).then(function (hash) {
        return hex(hash);
    });
}

// Convert binary hash to hex string
function hex(buffer) {
    var hexCodes = [];
    var view = new DataView(buffer);
    for (var i = 0; i < view.byteLength; i += 4) {
        var value = view.getUint32(i);
        var stringValue = value.toString(16);
        var padding = '00000000';
        var paddedValue = (padding + stringValue).slice(-padding.length);
        hexCodes.push(paddedValue);
    }
    return hexCodes.join('');
}

function distanceBetweenTouches(t1, t2) {
    var dx = t2.clientX - t1.clientX;
    var dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}


var intervalClear = setInterval((function () {
    var nextVelocity = distance / interval;
    if (!velocity) { velocity = nextVelocity; return }
    var acceleration = (nextVelocity - velocity) / interval;
    if (directionChangeCount && acceleration > threshold) {
        sendSignalData("mouse_shakes")
    } distance = 0; directionChangeCount = 0; velocity = nextVelocity
}), interval);


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

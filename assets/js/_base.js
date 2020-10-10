/*
    NOTE: tracking is removed from this method.

    initEnv()
    Set up debug environment
    Use another template if the project requires tracking

    Default behaviour is applied when
        debugLevel = null

    Default behaviour:
    if project is run from localhost or local file
        Console-logging via log() is ENABLED (debugLevel = 1)
    else
        Console-logging via log() is DISABLED (debugLevel = 0)

    debugLevel can be overridden in the variable declaration

    debugLevel values:
    0 = off
        Call to log() and debug() functions are ignored
        Debug container is not visible
    1 = partial
        Debug container is not visible
        log() and debug() functions apply
    2 = full
        Debug container is visible
        log() and debug() functions apply
*/
function initEnv() {

    // set default debugLevel
    if (debugLevel !== undefined && debugLevel === null) {
        if (window.location.hostname === "localhost"
            || /^file:\/\/\//.test(window.location.href)) {
            debugLevel = 1;
        } else {
            debugLevel = 0;
        }
    }

    log(`debugLevel = ${debugLevel}`);

    // show debug container
    if (debugLevel > 1 && z(".debug")) {
        z(".debug").addClass("visible");
    }

}

/*
    add string to debug container if debugLevel allows it
*/
function debug(s) {
    if (debugLevel > 0 && z(".debug")) {
        z(".debug").prepend(s + "<br />");
    }
}

/*
    log string to console if debugLevel allows it
*/
function log(s) {
    if (debugLevel > 0) {
        console.log(s);
    }
}

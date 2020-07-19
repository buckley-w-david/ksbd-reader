let count = 0
/**
 * Insert the page-hiding CSS into the active tab,
 * then get the beast URL and
 * send a "beastify" message to the content script in the active tab.
 */
function convert(tabs) {
  browser.tabs.insertCSS({file: "view/reader.css"}).then(() => {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "convert",
    });
  });
}

/**
 * Remove the page-hiding CSS from the active tab,
 * send a "reset" message to the content script in the active tab.
 */
function reset(tabs) {
  browser.tabs.removeCSS({file: "view/reader.css"}).then(() => {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "reset",
    });
  });
}

/**
 * There was an error executing the script.
 * Display the popup"s error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  console.error(`Failed to execute reader content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn"t inject the script, handle the error.
 */
browser.browserAction.onClicked.addListener(async () => {
  browser.tabs.executeScript({file: "/content_scripts/reader.js"})
  count = (count+1)&1
  if (count) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(convert)
        .catch(reportExecuteScriptError);
  } else {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportExecuteScriptError);
  }
});

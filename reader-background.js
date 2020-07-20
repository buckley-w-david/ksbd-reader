/**
 * Insert the page-hiding CSS into the active tab,
 * then get the beast URL and
 * send a "beastify" message to the content script in the active tab.
 */
function convert(tab) {
  browser.tabs.insertCSS({file: "view/reader.css"}).then(() => {
    browser.tabs.sendMessage(tab.id, {
      command: "convert",
    });
  });
}

/**
 * Remove the page-hiding CSS from the active tab,
 * send a "reset" message to the content script in the active tab.
 */
function reset(tab) {
  browser.tabs
        .removeCSS({file: "view/reader.css"})
        .then(() => {
            browser.tabs.sendMessage(tab.id, {
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
  await browser.tabs.executeScript({file: "/content_scripts/reader.js"})

  await browser.tabs.query({active: true, currentWindow: true})
    .then(async (tabs) => {
        const activeTab = tabs[0];
        // console.log(activeTab)
        browser.tabs.sendMessage(activeTab.id, {
            command: 'converted?'
        })
        .then((response) => {
            if (response.result) {
                reset(activeTab)
            } else {
                convert(activeTab)
            }
        })
    })
    .catch(reportExecuteScriptError);
});

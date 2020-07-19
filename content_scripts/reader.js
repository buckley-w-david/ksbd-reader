    // buttonContainer = document.createElement("div")
    // buttonContainer.id = "button-container"
    // buttonContainer.style.display = "flex"
    // buttonContainer.style.flexDirection = "column"
    // 
    // fs = document.createElement("button")
    // fs.id = "view-fullscreen"
    // fs.textContent = "Fullscreen"
    // fs.style.margin = "5px"
    // fs.addEventListener("click", function() {
    //     var docElm = document.documentElement;
    //     if (docElm.requestFullscreen) {
    //       docElm.requestFullscreen();
    //     } else if (docElm.msRequestFullscreen) {
    //       docElm.msRequestFullscreen();
    //     } else if (docElm.mozRequestFullScreen) {
    //       docElm.mozRequestFullScreen();
    //     } else if (docElm.webkitRequestFullScreen) {
    //       docElm.webkitRequestFullScreen();
    //     }
    // })
    // 
    // clear = document.createElement("button")
    // clear.id = "clear-storage"
    // clear.textContent = "Clear"
    // clear.style.margin = "5px"
    // clear.addEventListener("click", function() {
    //     browser.storage.local.remove("saved-page")
    // })
    // 
    // buttonContainer.appendChild(fs)
    // buttonContainer.appendChild(clear)
    // 
    // 
    // convertToReader(document)
    //
    //

(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasContentRun) {
    return;
  }
  window.hasContentRun = true;

  const PageStorage = {
    "next-page": {
        "URL": undefined,
        "node": undefined,
        "next": undefined,
        "prev": undefined,
    },
    "current-page": {
        "URL": undefined,
        "node": undefined,
        "next": undefined,
        "prev": undefined,
    },
    "previous-page": {
        "URL": undefined,
        "node": undefined,
        "next": undefined,
        "prev": undefined,
    }
  }

  const Selectors = {
      comic: "#comic img",
      next: ".comic-nav-next[href]",
      prev: ".comic-nav-prev[href]",
      readerComic: ".reader img",
  }

  async function preloadPage(url, target) {
    console.log(`Preloading ${url} into ${target}`)
    await fetch(url)
      .then((response) => {
          if (response.status !== 200) {
              console.error(`Bad status while fetching: ${response}`)
              return
          }
          return response.text()
      }).then((text) => {
          const html = document.createElement("html")
          html.innerHTML = text
          const next = html.querySelector(Selectors.next)
          const prev = html.querySelector(Selectors.prev)
          PageStorage[target] = {
              "URL": url,
              "node": html.querySelector(Selectors.comic),
              "next": next?.getAttribute("href"),
              "prev": prev?.getAttribute("href"),
          }
      })
      .catch((error) => {
          console.error(`Error fetching ${target} page at ${url}: ${error}`)
      })
  }

  async function convertToReader() {
    console.log("Convert reader call");

    comic = document.querySelector(Selectors.comic)
    nextPageElement = document.querySelector(Selectors.next)
    prevPageElement = document.querySelector(Selectors.prev)
    const promises = []

    if (nextPageElement !== null) {
        promises.push(preloadPage(nextPageElement.getAttribute("href"), 'next-page'))
    }
    if (prevPageElement !== null) {
        promises.push(preloadPage(prevPageElement.getAttribute("href"), 'previous-page'))
    }

    PageStorage['current-page'] = {
      "URL": document.location,
      "node": comic,
      "next": nextPageElement?.getAttribute("href"),
      "prev": prevPageElement?.getAttribute("href"),
  }

    const readerSection = document.createElement("section")
    readerSection.className = "reader"

    const response = await fetch(browser.runtime.getURL("view/reader.html"))
    readerSection.innerHTML = await response.text()
    readerSection.querySelector('#ksbd-image-container').appendChild(comic.cloneNode(true))
    document.body.appendChild(readerSection)

    await Promise.allSettled(promises)
  }

  async function nextPage() {
    console.log("Next page call");
    history.pushState(null, null, PageStorage['next-page'].URL)
    comic = document.querySelector(Selectors.readerComic)
    comic.replaceWith(PageStorage['next-page'].node)

    // Shuffle PageStorage
    PageStorage["previous-page"] = PageStorage["current-page"]
    PageStorage["current-page"] = PageStorage["next-page"]
    prevPromise = preloadPage(PageStorage["current-page"].next, 'next-page')
  }

  async function prevPage() {
    console.log("Previous page call");
    history.pushState(null, null, PageStorage['previous-page'].URL)
    comic = document.querySelector(Selectors.readerComic)
    comic.replaceWith(PageStorage['previous-page'].node)

    // Shuffle PageStorage
    PageStorage["next-page"] = PageStorage["current-page"]
    PageStorage["current-page"] = PageStorage["previous-page"]
    PageStorage["previous-page"] = preloadPage(PageStorage["previous-page"].previous, 'next-page')
  }

  async function reset() {
    console.log("Reset page call");
    document.querySelector('.reader').remove()
    if (document.location !== PageStorage["current-page"].URL) {
        document.location = PageStorage["current-page"].URL
    }
  }

  async function listener(e) {
      const target = e.target
      console.log(`Got a click: ${e}`)
      /**
       * Just log the error to the console.
       */
      function reportError(error) {
        console.error(`Could not do the thing: ${error}`);
      }

      /**
       * Get the active tab,
       * then call appropraite function
       */
      if (e.target.classList.contains("next-page")) {
          await nextPage()
      }
      else if (e.target.classList.contains("prev-page")) {
          await prevPage()
      }
  }
  /**
   * Listen for messages from the background script.
   * Call "convertToReader()" or "reset()".
  */
  browser.runtime.onMessage.addListener(async (message) => {
    console.log(`Got a message! ${message}`)
    if (message.command === "convert") {
      await convertToReader();
      document.querySelector(".reader").addEventListener("click", listener)
    } else if (message.command === "reset") {
      await reset();
    }
  });

})();

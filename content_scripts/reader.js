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


(function () {
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
      URL: undefined,
      nodes: undefined,
      next: undefined,
      previous: undefined,
    },
    "current-page": {
      URL: undefined,
      nodes: undefined,
      next: undefined,
      previous: undefined,
    },
    "previous-page": {
      URL: undefined,
      nodes: undefined,
      next: undefined,
      previous: undefined,
    },
  };

  let converted = false;

  const Selectors = {
    comic: "#comic img",
    next: ".comic-nav-next[href]",
    previous: ".comic-nav-previous[href]",
    readerComic: ".reader img",
    readerComicContainer: ".reader .image-container",
  };

  function debounce(func, timer = 100) {
    let debounce_timer;
    return (...args) => {
      if (debounce_timer) {
        window.clearTimeout(debounce_timer);
      }
      debounce_timer = window.setTimeout(function () {
        func(...args);
      }, timer);
    };
  }

  async function preloadPage(url) {
    console.log(`Preloading ${url}`);
    return await fetch(url)
      .then((response) => {
        if (response.status !== 200) {
          console.error(`Bad status while fetching: ${response}`);
          return;
        }
        return response.text();
      })
      .then((text) => {
        const html = document.createElement("html");
        html.innerHTML = text;
        const next = html.querySelector(Selectors.next);
        const previous = html.querySelector(Selectors.previous);
        return {
          URL: url,
          nodes: Array.from(html.querySelectorAll(Selectors.comic)),
          next: next?.getAttribute("href"),
          previous: previous?.getAttribute("href"),
        };
      })
      .catch((error) => {
        console.error(`Error fetching ${target} page at ${url}: ${error}`);
      });
  }

  async function convertToReader() {
    console.log("Convert reader call");

    comics = Array.from(document.querySelectorAll(Selectors.comic));
    nextPageElement = document.querySelector(Selectors.next);
    previousPageElement = document.querySelector(Selectors.previous);
    let nextPromise = Promise.resolve({});
    let previousPromise = Promise.resolve({});

    if (nextPageElement !== null) {
      nextPromise = preloadPage(nextPageElement.getAttribute("href"));
    }
    if (previousPageElement !== null) {
      previousPromise = preloadPage(previousPageElement.getAttribute("href"));
    }

    PageStorage["current-page"] = {
      URL: document.location,
      nodes: comics.map((comic) => comic.cloneNode(true)),
      next: nextPageElement?.getAttribute("href"),
      previous: previousPageElement?.getAttribute("href"),
    };

    const readerSection = document.createElement("section");
    readerSection.className = "reader";

    const response = await fetch(browser.runtime.getURL("view/reader.html"));
    readerSection.innerHTML = await response.text();
    PageStorage["current-page"].nodes.forEach((comic) => {
      readerSection
        .querySelector("#ksbd-image-container")
        .appendChild(comic);
    });
    document.body.appendChild(readerSection);

    const results = await Promise.allSettled([nextPromise, previousPromise]);
    PageStorage["next-page"] = results[0].value;
    PageStorage["previous-page"] = results[1].value;
  }

  async function nextPage() {
    console.log("Next page call");
    history.pushState(null, null, PageStorage["next-page"].URL);
    Array.from(document.querySelectorAll(Selectors.readerComic)).forEach(
      (comic) => {
        comic.remove();
      }
    );
    const container = document.querySelector(Selectors.readerComicContainer);
    PageStorage["next-page"].nodes.forEach((comic) => {
      container.appendChild(comic);
    });

    // Shuffle PageStorage
    PageStorage["previous-page"] = PageStorage["current-page"];
    PageStorage["current-page"] = PageStorage["next-page"];
    PageStorage["next-page"] = await preloadPage(
      PageStorage["current-page"].next
    );
  }

  async function previousPage() {
    console.log("Previous page call");
    history.pushState(null, null, PageStorage["previous-page"].URL);
    comic = document.querySelector(Selectors.readerComic);
    Array.from(document.querySelectorAll(Selectors.readerComic)).forEach(
      (comic) => {
        comic.remove();
      }
    );

    const container = document.querySelector(Selectors.readerComicContainer);
    PageStorage["previous-page"].nodes.forEach((comic) => {
      container.appendChild(comic);
    });

    // Shuffle PageStorage
    PageStorage["next-page"] = PageStorage["current-page"];
    PageStorage["current-page"] = PageStorage["previous-page"];
    PageStorage["previous-page"] = await preloadPage(
      PageStorage["previous-page"].previous
    );
  }

  async function reset() {
    console.log("Reset page call");
    document.querySelector(".reader").remove();
    if (document.location !== PageStorage["current-page"].URL) {
      document.location = PageStorage["current-page"].URL;
    }
  }

  function requestFullscreen() {
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen();
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen();
    }
  }

  function requestExitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  async function fullscreen() {
    console.log("Fullscreen page call");
    requestFullscreen();

    async function scrollListener(e) {
      const scrollTop =
        (document.documentElement && document.documentElement.scrollTop) ||
        document.body.scrollTop;
      const scrollHeight =
        (document.documentElement && document.documentElement.scrollHeight) ||
        document.body.scrollHeight;
      const scrolledToBottom = scrollTop + window.innerHeight >= scrollHeight;

      if (e.deltaY < 0 && window.pageYOffset === 0) {
        console.log("scrolling up");
        await previousPage();
      } else if (e.deltaY > 0 && scrolledToBottom) {
        console.log("scrolling down");
        await nextPage();
      }
    }
    const debounced = debounce(scrollListener);

    async function keyupListener(e) {
      if (e.key === "q") {
        document.querySelector(".reader").classList.remove("fullscreen");
        window.removeEventListener("wheel", debounced);
        window.removeEventListener("keyup", keyupListener);
        requestExitFullscreen();
      }
    }

    document.querySelector(".reader").classList.add("fullscreen");
    window.addEventListener("wheel", debounced);
    window.addEventListener("keyup", keyupListener);
  }

  async function clickListener(e) {
    const target = e.target;
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
      await nextPage();
    } else if (e.target.classList.contains("previous-page")) {
      await previousPage();
    } else if (e.target.classList.contains("fullscreen")) {
      await fullscreen();
    } else if (e.target.tagName === "IMG") {
      const per = e.x / e.target.getBoundingClientRect().width;
      if (per < 1 / 3) {
        await previousPage();
      } else if (per > 2 / 3) {
        await nextPage();
      } else {
        // toggleModal()
      }
    }
  }
  /**
   * Listen for messages from the background script.
   * Call "convertToReader()" or "reset()".
   */
  browser.runtime.onMessage.addListener(async (message) => {
    if (message.command === "convert") {
      converted = true;
      await convertToReader();
      document
        .querySelector(".reader")
        .addEventListener("click", clickListener);
    } else if (message.command === "reset") {
      converted = false;
      await reset();
    } else if (message.command === "converted?") {
      console.log(`Response to query: ${converted}`);
      return Promise.resolve({ result: converted });
    }
  });
})();


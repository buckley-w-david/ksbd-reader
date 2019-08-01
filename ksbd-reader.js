var nextBody  = null
var nextPage  = null
var savedPage = null

function isEmpty(obj) {
    return Object.entries(obj).length === 0 && obj.constructor === Object
}

function getLocation(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
}

browser.storage.local.get("saved-page").then(
    function(result) {
        if (!isEmpty(result)) {
            console.log("saved page: ", result)
            console.log("current page: ", document.location.href)
            if (document.location.pathname !== result["saved-page"]) {
                document.location.pathname = result["saved-page"]
            }
        } else {
            browser.storage.local.set({"saved-page": document.location.pathname})
        }
    },
    function(error) {
        console.log("error: ", error)
    }
)


function getComic(doc) {
    comic = doc.getElementById("comic")
    comicLink = comic.getElementsByTagName("a")
    if (comicLink.length === 0) {
        comicImg = comic.getElementsByTagName("img")[0]
    } else {
        comicImg = comicLink[0].getElementsByTagName("img")[0]
    }

    comicImg.id = "comic-image"
    return comicImg
}

function getSidebar(doc) {
    sidebar = doc.getElementById("sidebar-under-comic")
    return sidebar
}

function preloadNextPage(doc) {
    console.log("preloading...")
    nextPage = getSidebar(doc).getElementsByClassName("navi comic-nav-next navi-next")[0].href
    fetch(nextPage)
      .then(
        function(response) {
          if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' +
              response.status);
            return;
          }

          // Examine the text in the response
          response.text().then(function(data) {
            html = document.createElement("html")
            html.innerHTML = data
            nextBody = html.getElementsByTagName("body")[0]
          });
        }
      )
      .catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
}
preloadNextPage(document)

buttonContainer = document.createElement("div")
buttonContainer.id = "button-container"
buttonContainer.style.display = "flex"
buttonContainer.style.flexDirection = "column"

fs = document.createElement("button")
fs.id = "view-fullscreen"
fs.textContent = "Fullscreen"
fs.style.margin = "5px"
fs.addEventListener("click", function() {
    var docElm = document.documentElement;
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen();
    } else if (docElm.msRequestFullscreen) {
      docElm.msRequestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen();
    }
})

clear = document.createElement("button")
clear.id = "clear-storage"
clear.textContent = "Clear"
clear.style.margin = "5px"
clear.addEventListener("click", function() {
    browser.storage.local.remove("saved-page")
})

buttonContainer.appendChild(fs)
buttonContainer.appendChild(clear)

function convertToReader(doc) {
    comicWrap = doc.getElementById("comic-wrap")
    middleNav = doc.getElementsByClassName("comic_navi_center")[0]
    comic = getComic(doc)
    sidebar = getSidebar(doc)

    var navigation = document.getElementsByClassName("navi")
    for(var i = 0; i < navigation.length; i++)
    {
        navigation.item(i).addEventListener("click", function() {
            browser.storage.local.remove("saved-page")
        })
    }

    newComicContainer = document.createElement("div")
    imageContainer = document.createElement("div")

    imageContainer.id = "image-container"
    imageContainer.addEventListener("click", function() {
        document.getElementById("comic-wrap").replaceWith(nextBody)
        history.pushState(null, null, nextPage)

        l = getLocation(nextPage)
        console.log("next path: ", l.pathname)
        browser.storage.local.set({"saved-page": l.pathname})

        convertToReader(document)
        preloadNextPage(doc)
    })

    middleNav.appendChild(buttonContainer)

    // Stretch doc to full screen height
    doc.documentElement.style.height = '100%'
    doc.documentElement.style.backgroundColor = 'black'

    newComicContainer.style.marginTop = '10px'
    newComicContainer.style.marginBottom = 'auto'
    newComicContainer.style.display = 'flex'
    newComicContainer.style.alignItems = 'center'
    newComicContainer.style.justifyContent = 'center'

    sidebar.style.marginBottom = '10px'

    comicWrap.style.display = 'flex'
    comicWrap.style.flexDirection = 'column' 
    comicWrap.style.height = '100%' 

    middleNav.style.verticalAlign = 'middle'

    imageContainer.appendChild(comic)
    newComicContainer.appendChild(imageContainer)
    comicWrap.insertBefore(newComicContainer, comicWrap.childNodes[0])

    doc.body.replaceWith(comicWrap)
}

convertToReader(document)

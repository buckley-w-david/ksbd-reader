# Kill Six Billion Demons Reader

I've heard a lot of good things about the web comic [Kill Six Billion Demons](https://killsixbilliondemons.com), but found the experience of reading it on the website to be sub-par.

My main complains can be summed up by:
1. There's a lot of stuff on each page that I just don't care about (Links to other places on the site, comments sections, etc). It makes the page unnecessarily noisy.
2. Some of the images can be somewhat large (Which is understandable given their detail) and on my less-than-stellar internet speed page load times were dragging me down.

This extension is my answer to both of those problems.

After it is run against a page of the comic, everything but the image and basic nav (next and previous page) is hidden. This solves issue #1.

The page has also been turned into a extremely basic SPA. The next and previous pages are loaded ahead of time so that while you are reading the current page, the next one is already downloading. The navigation buttons simply swap the image with the next/previous image that is already ready. This solves issue #2.

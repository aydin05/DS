/**
 * Enhanced Player class with precise timing control
 * Uses RequestAnimationFrame for more accurate timing
 */
class Player {
    constructor(slides) {
        this.slides = slides;
        this.currentSlide = 1;
        this.slidesCount = slides.length;
        this.slideItems = [];
        this.isGlobalString = false;
        this.globalSlide = [];
        this.globalSlideNum = 0;
        
        // Timing variables
        this.slideStartTime = 0;
        this.slideDuration = 0;
        this.animationFrameId = null;
        this.isSlidePlaying = false;
        this._lastVideoElement = null;
        this._transitionTimeoutId = null;
        this._mediaTimeoutId = null;
        this._stopped = false;
        this._freezeCanvas = null;
        
        // Reference to video element
        this.videoElement = null;
        Logger.info("Player initialized.", { slideCount: slides.length }); //
    }

    stopPlayer() {
        Logger.info("Player stopping."); //
        this._stopped = true;

        // Cancel all pending timeouts
        if (this._transitionTimeoutId) {
            clearTimeout(this._transitionTimeoutId);
            this._transitionTimeoutId = null;
            Logger.info("Pending transition timeout cancelled.");
        }
        if (this._mediaTimeoutId) {
            clearTimeout(this._mediaTimeoutId);
            this._mediaTimeoutId = null;
            Logger.info("Pending media timeout cancelled.");
        }

        // Stop animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            Logger.info("Animation frame cancelled."); //
        }
        
        // Stop video and release hardware decoder
        if (this.videoElement) {
            try {
                this.videoElement.pause();
                this.videoElement.removeAttribute('src');
                this.videoElement.load();
            } catch (e) { /* ignore */ }
            Logger.info("Video stopped and decoder released."); //
            this.videoElement = null;
        }
        if (this._freezeCanvas) {
            this._freezeCanvas.remove();
            this._freezeCanvas = null;
        }
        if (this._lastVideoElement) {
            try {
                this._lastVideoElement.pause();
                this._lastVideoElement.removeAttribute('src');
                this._lastVideoElement.load();
            } catch (e) { /* ignore */ }
            this._lastVideoElement = null;
        }
        
        // Reset state
        this.slides = [];
        this.currentSlide = 1;
        this.isGlobalString = false;
        this.globalSlide = [];
        this.isSlidePlaying = false;
        Logger.info("Player state reset."); //
        
        // Clear any existing content
        let contentWrap = document.getElementById("content-wrap");
        if (contentWrap) {
            contentWrap.innerHTML = "";
            Logger.info("Content container cleared."); //
        }
    }

    startPlayer() {
        Logger.info("Player starting."); //
        this._stopped = false;
        // Initialize player
        this.processSlides();
        this.currentSlide = 1;
        Logger.info("Processed slides array, total after processing:", { slidesCount: this.slides.length }); //
        this.showSlide(this.currentSlide);
    }
    
    processSlides() {
        Logger.info("Processing slides to extract globaltext and filter slides."); //
        let newArray = [];
        for (let i = 0; i < this.slides.length; i++) {
            let hasGlobalText = false;
            let hasOtherContent = false;
            for (let i2 = 0; i2 < this.slides[i].items.length; i2++) {
                if (this.slides[i].items[i2].type_content === "globaltext") {
                    this.isGlobalString = true;
                    this.globalSlide = this.slides[i].items[i2];
                    hasGlobalText = true;
                    Logger.info("Found globaltext in slide", { slideIndex: i, globalTextItem: this.globalSlide }); //
                } else {
                    hasOtherContent = true;
                }
            }
            // Only add slide if it has content other than globaltext
            if (hasOtherContent || !hasGlobalText) {
                newArray.push(this.slides[i]);
            } else {
                Logger.info("Filtering out globaltext-only slide", { slideIndex: i }); //
            }
        }
        this.slides = newArray;
        this.slidesCount = this.slides.length;
        Logger.info("Slides array updated, new count:", { slidesCount: this.slidesCount }); //
    }

    showSlide(slideIndex) {
        Logger.info(`Showing slide ${slideIndex}.`); //
        if (!this.slides || this.slides.length === 0 || slideIndex > this.slides.length) {
            console.error("Invalid slide index or no slides available");
            Logger.error("Invalid slide index or no slides available", { slideIndex, slidesLength: this.slides ? this.slides.length : 0 }); //
            return;
        }
        
        // Stop previous animation frame if running
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            Logger.info("Previous animation frame cancelled before showing new slide."); //
        }

        // DO NOT release old video here — keep old slide visible as a cover
        // while the new slide loads behind it. Decoder is released in
        // transitionToNextSlide() when old container is removed.
        
        // Get current slide data
        const slideData = this.slides[slideIndex - 1];
        const slideItems = slideData.items;
        
        // Get slide duration (in milliseconds)
        this.slideDuration = (slideData.duration || 5) * 1000; // Convert to milliseconds, default 5s
        Logger.info("Slide duration set (ms):", { slideDuration: this.slideDuration }); //
        
        // Create container for the next slide
        this.prepareNextSlideContainer(slideItems);
    }
    
    prepareNextSlideContainer(slideItems) {
        Logger.info("Preparing container for next slide.", { itemCount: slideItems.length }); //
        // Get current content container
        const currentContainer = document.getElementById("content-wrap");
        
        // Create new container BEHIND the old one so old slide stays visible
        const nextContainer = document.createElement("div");
        nextContainer.id = "next-content-wrap";
        nextContainer.style.position = "absolute";
        nextContainer.style.top = "0";
        nextContainer.style.left = "0";
        nextContainer.style.width = "100%";
        nextContainer.style.height = "100%";
        nextContainer.style.opacity = "1";
        nextContainer.style.background = "#000";
        // Place BEHIND old container — old slide covers this while it loads
        nextContainer.style.zIndex = "1";
        if (currentContainer) {
            currentContainer.style.zIndex = "2";
        }
        
        // Insert before current container (behind in DOM)
        if (currentContainer && currentContainer.parentNode) {
            currentContainer.parentNode.insertBefore(nextContainer, currentContainer);
            Logger.info("Inserted next slide container BEHIND current container."); //
        } else {
            document.body.appendChild(nextContainer);
            Logger.info("No current container found; appended next container to body."); //
        }
        
        // Load all content for the slide
        this.loadSlideContent(nextContainer, slideItems);
    }
    
    loadSlideContent(container, slideItems) {
        Logger.info("Loading slide content into container.", { slideItemsCount: slideItems.length }); //
        // Reset video reference — will be set only if this slide has a video item.
        this.videoElement = null;

        // If old video holds the HW decoder, capture its last frame as a canvas
        // and release the decoder NOW so the new video can actually load.
        if (this._lastVideoElement) {
            this._captureFrameAndReleaseDecoder();
        }

        // Track if we're loading media that needs to complete
        let mediaLoading = false;
        const mediaElements = [];
        
        // Add global text if exists
        if (this.isGlobalString) {
            const globalTextElement = this.addTextElement(this.globalSlide);
            container.appendChild(globalTextElement);
            Logger.info("Appended global text element to slide container."); //
        }
        
        // Add all slide items
        for (const item of slideItems) {
            let element = null;
            
            switch (item.type_content) {
                case "text":
                case "globaltext":
                    Logger.info("Adding text element to slide.", { item }); //
                    element = this.addTextElement(item);
                    break;
                case "video":
                    Logger.info("Adding video element to slide.", { url: item.attr.location }); //
                    element = this.addVideoElement(item);
                    mediaLoading = true;
                    mediaElements.push(element);
                    // Store reference to video
                    this.videoElement = element;
                    break;
                case "image":
                    Logger.info("Adding image element to slide.", { url: item.attr.location }); //
                    element = this.addImageElement(item);
                    mediaLoading = true;
                    mediaElements.push(element);
                    break;
                case "site":
                    Logger.info("Adding URL (iframe) element to slide.", { url: item.attr.url }); //
                    element = this.addURLElement(item);
                    break;
                case "table":
                    Logger.info("Adding table element to slide."); //
                    element = this.addTableElement(item);
                    break;
                default:
                    Logger.warn("Unknown item type, skipping element creation.", { type: item.type_content }); //
            }
            
            if (element) {
                container.appendChild(element);
                Logger.info("Appended element to slide container.", { elementType: item.type_content }); //
            }
        }
        
        if (mediaLoading) {
            Logger.info("Media detected in slide; waiting for media load events."); //
            this.waitForMediaLoad(container, mediaElements);
        } else {
            Logger.info("No media in slide; transitioning immediately."); //
            this.transitionToNextSlide(container);
        }
    }
    
    waitForMediaLoad(container, mediaElements) {
        Logger.info("waitForMediaLoad started.", { mediaElementsCount: mediaElements.length }); //
        let loadedCount = 0;
        const totalElements = mediaElements.length;
        let transitioned = false;
        
        const doTransition = () => {
            if (transitioned || this._stopped) return;
            transitioned = true;
            if (this._mediaTimeoutId) {
                clearTimeout(this._mediaTimeoutId);
                this._mediaTimeoutId = null;
            }
            Logger.info("All media elements have loaded successfully."); //
            this.transitionToNextSlide(container);
        };
        
        const checkAllLoaded = () => {
            if (loadedCount >= totalElements) {
                doTransition();
            }
        };
        
        // Set up load handlers for each media element
        mediaElements.forEach(element => {
            if (element.tagName.toLowerCase() === 'img') {
                if (element.complete) {
                    loadedCount++;
                    Logger.info("Image element was already complete."); //
                    checkAllLoaded();
                } else {
                    element.onload = () => {
                        loadedCount++;
                        Logger.info("Image element loaded."); //
                        checkAllLoaded();
                    };
                    element.onerror = () => {
                        console.error("Failed to load image");
                        Logger.error("Image failed to load, continuing with fallback.", { src: element.src }); //
                        loadedCount++;
                        checkAllLoaded();
                    };
                }
            } else if (element.tagName.toLowerCase() === 'video') {
                if (element.readyState >= 3) { // HAVE_FUTURE_DATA
                    loadedCount++;
                    Logger.info("Video element already ready."); //
                    checkAllLoaded();
                } else {
                    element.oncanplay = () => {
                        loadedCount++;
                        Logger.info("Video element ready to play."); //
                        checkAllLoaded();
                    };
                    element.onerror = function(e) {
                        // Count as error if src is set to a real URI (file:// or http://)
                        // Ignore errors from empty src (Tizen async filesystem resolve pending)
                        var hasSrc = element.src && (
                            element.src.indexOf('file://') !== -1 ||
                            element.src.indexOf('http://') !== -1 ||
                            element.src.indexOf('https://') !== -1
                        );
                        if (hasSrc) {
                            console.error("Failed to load video");
                            Logger.error("Video failed to load, continuing with fallback.", { src: element.src });
                            loadedCount++;
                            checkAllLoaded();
                        } else {
                            Logger.warn("Video error ignored - waiting for Tizen filesystem resolve.", { src: element.src });
                        }
                    };
                }
            }
        });
        
        // Safety timeout - if media doesn't load within 8 seconds, continue anyway
        this._mediaTimeoutId = setTimeout(() => {
            if (!transitioned && !this._stopped) {
                console.warn("Some media elements didn't load in time, continuing anyway");
                Logger.warn("Media load timeout reached; transitioning slide despite incomplete loads.", { loadedCount, totalElements }); //
                doTransition();
            }
        }, 8000);
    }
    
    // Capture the current video frame to a canvas overlay, then release the HW decoder.
    // This lets the user see a frozen frame while the new video loads.
    _captureFrameAndReleaseDecoder() {
        var oldVideo = this._lastVideoElement;
        if (!oldVideo) return;

        // Try to paint the current frame onto a canvas
        try {
            var w = oldVideo.videoWidth || 1920;
            var h = oldVideo.videoHeight || 1080;
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '10';
            canvas.id = 'freeze-frame';
            var ctx = canvas.getContext('2d');
            ctx.drawImage(oldVideo, 0, 0, w, h);
            document.body.appendChild(canvas);
            this._freezeCanvas = canvas;
            Logger.info("Captured freeze-frame from old video.", { w: w, h: h });
        } catch (e) {
            Logger.warn("Could not capture freeze-frame.", { error: e.message });
            this._freezeCanvas = null;
        }

        // Release the HW decoder so the new video can load
        try {
            oldVideo.pause();
            oldVideo.removeAttribute('src');
            oldVideo.load();
        } catch (e) { /* ignore */ }
        this._lastVideoElement = null;
        Logger.info("Released old video decoder after freeze-frame capture.");
    }

    transitionToNextSlide(nextContainer) {
    	  Logger.info("Transitioning to next slide.");
    	  if (this._stopped) return;

    	  var currentContainer = document.getElementById("content-wrap");

    	  // Clean up any leftover old video (shouldn't happen, but safety)
    	  if (this._lastVideoElement) {
    	    try {
    	      this._lastVideoElement.pause();
    	      this._lastVideoElement.removeAttribute('src');
    	      this._lastVideoElement.load();
    	    } catch (e) { /* ignore */ }
    	    this._lastVideoElement = null;
    	  }

    	  // Remove old container
    	  if (currentContainer) currentContainer.remove();

    	  // Remove freeze-frame canvas (new slide is ready behind it)
    	  if (this._freezeCanvas) {
    	    this._freezeCanvas.remove();
    	    this._freezeCanvas = null;
    	    Logger.info("Removed freeze-frame canvas.");
    	  }

    	  nextContainer.id = "content-wrap";
    	  nextContainer.style.zIndex = "1";

    	  var newVideo = this.videoElement;
    	  this._lastVideoElement = newVideo;

    	  if (newVideo) {
    	    try {
    	      newVideo.currentTime = 0;
    	    } catch (e) { /* ignore */ }

    	    var playPromise = newVideo.play();
    	    if (playPromise !== undefined) {
    	      playPromise
    	        .then(function() {
    	          Logger.info("New video started playing.", { muted: newVideo.muted });
    	        })
    	        .catch(function(err) {
    	          if (err.name === 'NotAllowedError' && !newVideo.muted) {
    	            Logger.warn("Unmuted play blocked by autoplay policy, retrying muted.");
    	            newVideo.muted = true;
    	            newVideo.play().catch(function() {});
    	          } else if (err.name !== 'AbortError') {
    	            Logger.error("Error playing video element after transition.", { error: err.message });
    	          }
    	        });
    	    }
    	  }

    	  // Start precise timer for this slide
    	  this.startPreciseTimer();
    	}
    
    startPreciseTimer() {
        // Record exact start time
        this.slideStartTime = performance.now();
        this.isSlidePlaying = true;
        Logger.info("Precise timer started.", { slideStartTime: this.slideStartTime, slideDuration: this.slideDuration }); //
        
        // Use requestAnimationFrame for more precise timing
        const checkTime = (timestamp) => {
            if (!this.isSlidePlaying) {
                Logger.info("Precise timer canceled, no longer checking time."); //
                return;
            }
            
            // Calculate elapsed time
            const elapsed = timestamp - this.slideStartTime;
            
            // If it's time to change slides
            if (elapsed >= this.slideDuration) {
                Logger.info("Slide duration elapsed, advancing to next slide.", { elapsed, slideDuration: this.slideDuration }); //
                this.isSlidePlaying = false;
                this.goToNextSlide();
            } else {
                // Continue checking time
                this.animationFrameId = requestAnimationFrame(checkTime);
            }
        };
        
        // Start animation frame loop
        this.animationFrameId = requestAnimationFrame(checkTime);
    }
    
    goToNextSlide() {
        Logger.info("Going to next slide.", { currentSlide: this.currentSlide, totalSlides: this.slidesCount }); //

        // Single-slide optimization: replay video in-place instead of destroying/recreating DOM.
        if (this.slidesCount === 1 && this._lastVideoElement) {
            Logger.info("Single slide with video — replaying in-place.");
            try {
                this._lastVideoElement.currentTime = 0;
                this._lastVideoElement.play().catch(function() {});
            } catch (e) { /* ignore */ }
            this.startPreciseTimer();
            return;
        }

        if (this.currentSlide === this.slidesCount) {
            this.currentSlide = 1;
        } else {
            this.currentSlide++;
        }
        Logger.info("Updated currentSlide index.", { newCurrentSlide: this.currentSlide }); //

        this.showSlide(this.currentSlide);
    }
    
    // The original element creation methods
    addTextElement(element) {
        Logger.info("addTextElement invoked.", { element }); //
        let elementWrap = document.createElement("div");
        elementWrap.style.position = "absolute";
        elementWrap.style.width = element.width + "px";
        elementWrap.style.backgroundColor = element.attr.frame_bg_color || "transparent";
        elementWrap.style.color = element.attr.color || "#000000";
        elementWrap.style.top = element.top + "px";
        elementWrap.style.left = element.left + "px";
        if (element.attr.font_size) {
            elementWrap.style.fontSize = element.attr.font_size + "px";
        }
        elementWrap.style.height = element.height + "px ";
        elementWrap.style.overflow = "hidden";
        elementWrap.style.zIndex = element.index;
        if(element.attr.is_scrolling) {
            let el = document.createElement("marquee")
            el.direction = element.attr.direction;
            el.scrollAmount = element.attr.speed;
            let innerText = element.attr.textarea.replace("font - size", "font-size");
            innerText = innerText.replace(" px", "px");
            el.innerHTML = innerText;
            elementWrap.append(el);
            Logger.info("Created scrolling text element (marquee)."); //
        } else {
            let innerText = element.attr.textarea.replace("font - size", "font-size");
            innerText = innerText.replace(" px", "px");
            elementWrap.innerHTML = innerText;
            Logger.info("Created static text element."); //
        }
        return elementWrap;
    }

    addVideoElement(element) {
        Logger.info("addVideoElement invoked.", { url: element.attr.location }); //
        let elementWrap = document.createElement("video");
        elementWrap.setAttribute("type", "video/mp4");
        // No autoplay - playback is controlled manually in transitionToNextSlide
        elementWrap.controls = false;
        elementWrap.setAttribute("playsinline", "");
        elementWrap.setAttribute("preload", "auto");
        elementWrap.muted = (element.attr && element.attr.ismute !== undefined) ? !!element.attr.ismute : true;
        Logger.info("Video muted state set.", { muted: elementWrap.muted }); //
        elementWrap.style.position = "absolute";
        elementWrap.style.top = element.top + "px";
        elementWrap.style.left = element.left + "px";
        elementWrap.style.width = element.width + "px";
        elementWrap.style.height = element.height + "px";
        elementWrap.style.zIndex = element.index;
        elementWrap.style.objectFit = "fill";
        elementWrap.style.backgroundColor = "#000";
        
        var loc = element.attr.location;
        var isRemote = loc.indexOf('http://') === 0 || loc.indexOf('https://') === 0;
        var isAbsolute = loc.charAt(0) === '/';

        if (isRemote) {
            // Streaming mode — use HTTP URL directly
            elementWrap.src = loc;
            Logger.info("Video src set to remote URL (streaming).", { src: loc });
        } else if (isAbsolute) {
            // Absolute filesystem path from Download API — prepend file://
            elementWrap.src = 'file://' + loc;
            Logger.info("Video src set to local file URI.", { src: elementWrap.src });
        } else {
            // Virtual root path — resolve via Tizen filesystem
            try {
                if (typeof tizen !== 'undefined' && tizen.filesystem) {
                    tizen.filesystem.resolve(
                        loc,
                        function (file) {
                            var uri = tizen.filesystem.toURI(file.fullPath);
                            elementWrap.src = uri;
                            Logger.info("Video src set via Tizen filesystem URI.", { uri: uri });
                        },
                        function (err) {
                            Logger.error("Video Tizen resolve failed.", { error: err.message });
                            elementWrap.src = loc;
                        },
                        "r"
                    );
                } else {
                    elementWrap.src = loc;
                }
            } catch (e) {
                Logger.error("Unexpected exception in addVideoElement.", { error: e.message });
                elementWrap.src = loc;
            }
        }
        
        return elementWrap;
    }

    addImageElement(element) {
        Logger.info("addImageElement invoked.", { url: element.attr.location }); //
        let elementWrap = document.createElement("img");
        elementWrap.style.position = "absolute";
        elementWrap.style.top = element.top + "px";
        elementWrap.style.left = element.left + "px";
        elementWrap.style.width = element.width + "px";
        elementWrap.style.height = element.height + "px";
        elementWrap.style.zIndex = element.index;
        elementWrap.style.objectFit = "contain";

        var loc = element.attr.location;
        var isRemote = loc.indexOf('http://') === 0 || loc.indexOf('https://') === 0;
        var isAbsolute = loc.charAt(0) === '/';

        if (isRemote) {
            elementWrap.src = loc;
            Logger.info("Image src set to remote URL (streaming).", { src: loc });
        } else if (isAbsolute) {
            // Absolute filesystem path from Download API — prepend file://
            elementWrap.src = 'file://' + loc;
            Logger.info("Image src set to local file URI.", { src: elementWrap.src });
        } else {
            // Virtual root path — resolve via Tizen filesystem
            try {
                if (typeof tizen !== 'undefined' && tizen.filesystem) {
                    tizen.filesystem.resolve(
                        loc,
                        function (file) {
                            var uri = tizen.filesystem.toURI(file.fullPath);
                            elementWrap.src = uri;
                            Logger.info("Image src set via Tizen filesystem URI.", { uri: uri });
                        },
                        function (err) {
                            Logger.warn("Image Tizen resolve failed, using raw path.", { error: err.message });
                            elementWrap.src = loc;
                        },
                        "r"
                    );
                } else {
                    elementWrap.src = loc;
                }
            } catch (e) {
                Logger.warn("Image resolve exception, using raw path.", { error: e.message });
                elementWrap.src = loc;
            }
        }

        Logger.info("Image element created.", { location: element.attr.location }); //
        return elementWrap;
    }

    addURLElement(element) {
        Logger.info("addURLElement invoked.", { url: element.attr.url }); //
        let elementWrap = document.createElement("iframe");
        elementWrap.style.position = "absolute";
        elementWrap.style.top = element.top + "px";
        elementWrap.style.left = element.left + "px";
        elementWrap.style.width = element.width ? (element.width + "px") : "100vw";
        elementWrap.style.height = element.height ? (element.height + "px") : "100vh";
        elementWrap.style.zIndex = element.index;
        elementWrap.src = element.attr.url;
        elementWrap.setAttribute("allowfullscreen", "true");
        elementWrap.setAttribute("allow", "autoplay; fullscreen; encrypted-media");
        Logger.info("URL iframe element created.", { src: element.attr.url }); //
        return elementWrap;
    }

    addTableElement(item) {
        Logger.info("addTableElement invoked."); //
        const div = document.createElement("div");
        const table = document.createElement("table");
        div.style.backgroundColor = item.attr.bg_color || "transparent";
        table.style.tableLayout = "fixed";

        // Positioning and sizing: using the first value from display_types
        const borderColor = (item.attr.borderColor) ? item.attr.borderColor : "#ffa102";
        if(item.display_types && item.display_types.length) {
          const display = item.display_types[0];
          div.style.position = "absolute";
          div.style.top = display.top + "px";
          div.style.left = display.left + "px";
          div.style.width = display.width + "px";
          div.style.height = display.height + "px";
          div.style.zIndex = item.index || 1;
          table.style.width = "100%";
          Logger.info("Table container styled with display_types.", { display }); //
        }
        table.style.border = "1px solid " + borderColor;

        // Table header (thead)
        if(item.attr.columns && item.attr.columns.length) {
          const thead = document.createElement("thead");
          const headerRow = document.createElement("tr");
          const columnsCount = item.attr.columns.length;
          const percentWidth = (100 / columnsCount).toFixed(2) + "%";
          item.attr.columns.forEach(column => {
            const th = document.createElement("th");
            const p = document.createElement("p");
            p.classList.add("m-0");
            p.textContent = column.text;
            th.style.border = "1px solid " + borderColor;
            th.style.width = percentWidth;
            th.style.backgroundColor = column.attr.backgroundColor;
            // Apply style properties
            Object.assign(p.style, {
              color: column.attr.color,
              fontSize: column.attr.fontSize + "px",
              fontStyle: column.attr.fontStyle,
              textAlign: column.attr.textAlign
            });
            th.appendChild(p);
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          Logger.info("Table header constructed.", { columnsCount: item.attr.columns.length }); //
        }

        // Table body (tbody)
        if(item.attr.rows && item.attr.rows.length) {
          const tbody = document.createElement("tbody");
          item.attr.rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(cell => {
              const td = document.createElement("td");
              td.style.border = "1px solid " + borderColor;
              td.style.backgroundColor = cell.attr.backgroundColor;
              const p = document.createElement("p");
              p.classList.add("m-0");
              p.textContent = cell.text;
              Object.assign(p.style, {
                color: cell.attr.color,
                fontSize: cell.attr.fontSize + "px",
                fontStyle: cell.attr.fontStyle,
                textAlign: cell.attr.textAlign
              });
              td.appendChild(p);
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          Logger.info("Table body constructed.", { rowsCount: item.attr.rows.length }); //
        }
        div.appendChild(table);
        Logger.info("Table element appended to div container."); //
        return div;
    }
}

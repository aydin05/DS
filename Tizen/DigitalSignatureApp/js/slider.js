/**
 * Player — Tizen slide player with platform-adaptive video transitions.
 *
 * Tizen 7+ (2 decoders — dual-decoder mode):
 *   1. Show current slide (front layer, z-index 2)
 *   2. Load next slide behind it (back layer, z-index 1, opacity 1, muted)
 *   3. Pause back video after decoder warms up (stays at frame 0)
 *   4. Timer fires → hide front, play() back, destroy old after 300ms
 *
 * Tizen 4 (1 decoder — single-decoder mode):
 *   1. Show current slide (front layer)
 *   2. Load next slide behind it (back video NOT autoplayed, just preloaded)
 *   3. Timer fires → capture old frame to canvas → kill old video →
 *      play() new video → once playing, remove canvas
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

        // Timing
        this.slideStartTime = 0;
        this.slideDuration = 0;
        this.animationFrameId = null;
        this.isSlidePlaying = false;

        // Video tracking
        this.videoElement = null;        // current slide's video
        this._backVideoElement = null;   // back layer's video (next slide)
        this._backVideoOriginalMuted = false;

        // Back layer
        this._backContainer = null;
        this._backSlideIndex = -1;
        this._backVideoItem = null;  // stored video item data for single-decoder src-swap

        this._stopped = false;

        // Detect Tizen version for decoder strategy
        // Tizen 7+ has 2 hardware video decoders; Tizen 4 has only 1
        this._dualDecoder = false;
        try {
            var ua = navigator.userAgent || "";
            var m = ua.match(/Tizen\s+(\d+)/);
            if (m && parseInt(m[1], 10) >= 7) {
                this._dualDecoder = true;
            }
        } catch (e) {}
        Logger.info("Player initialized.", { slideCount: slides.length, dualDecoder: this._dualDecoder });
    }

    // ─── Lifecycle ────────────────────────────────────────────────────

    stopPlayer() {
        Logger.info("Player stopping.");
        this._stopped = true;

        if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }

        if (this.videoElement) {
            try { this.videoElement.pause(); } catch (e) {}
        }
        if (this._backVideoElement) {
            try { this._backVideoElement.pause(); } catch (e) {}
        }
        this.videoElement = null;
        this._backVideoElement = null;

        this._cleanupBack();

        this.slides = [];
        this.currentSlide = 1;
        this.isGlobalString = false;
        this.globalSlide = [];
        this.isSlidePlaying = false;

        var wrap = document.getElementById("content-wrap");
        if (wrap) wrap.remove();
        Logger.info("Player state reset.");
    }

    startPlayer() {
        Logger.info("Player starting.");
        this._stopped = false;
        this.processSlides();
        this.currentSlide = 1;
        Logger.info("Processed slides, count:", { slidesCount: this.slides.length });
        this._showFirstSlide();
    }

    processSlides() {
        Logger.info("Processing slides to extract globaltext and filter slides.");
        var newArray = [];
        for (var i = 0; i < this.slides.length; i++) {
            var hasGlobalText = false;
            var hasOtherContent = false;
            for (var i2 = 0; i2 < this.slides[i].items.length; i2++) {
                if (this.slides[i].items[i2].type_content === "globaltext") {
                    this.isGlobalString = true;
                    this.globalSlide = this.slides[i].items[i2];
                    hasGlobalText = true;
                } else {
                    hasOtherContent = true;
                }
            }
            if (hasOtherContent || !hasGlobalText) {
                newArray.push(this.slides[i]);
            }
        }
        this.slides = newArray;
        this.slidesCount = this.slides.length;
    }

    // ─── First slide (no transition needed) ──────────────────────────

    _showFirstSlide() {
        if (this._stopped) return;
        var slideData = this.slides[0];
        this.slideDuration = (slideData.duration || 5) * 1000;

        // Create front container
        var container = this._createContainer("content-wrap", "2");
        document.body.appendChild(container);

        this.videoElement = null;
        this._populateContainer(container, slideData.items);

        if (this._dualDecoder) {
            // TIZEN 7: wait for video to render a frame, then reveal
            this._waitForMedia(container, function () {
                container.style.opacity = "1";
            });
        } else {
            // TIZEN 4: show immediately at opacity 1.
            // Hole-punch video CANNOT render through opacity-0 parent,
            // so we must be visible from the start.
            container.style.opacity = "1";
            Logger.info("First slide shown immediately (single decoder).");
            this._startTimerAndLoadBack();
        }
    }

    // ─── Transition to next slide ────────────────────────────────────

    _transitionToNext() {
        if (this._stopped) return;
        Logger.info("Transitioning to next slide.");

        // Safety net: kill any orphaned video elements not tracked by us
        var allVids = document.querySelectorAll("video");
        for (var i = 0; i < allVids.length; i++) {
            var v = allVids[i];
            if (v !== this.videoElement && v !== this._backVideoElement) {
                Logger.warn("Killing orphaned video element.", { id: v.id });
                this._killVideo(v);
            }
        }

        var frontContainer = document.getElementById("content-wrap");
        var backContainer = this._backContainer;

        // If back layer exists and matches next slide, use it
        var nextIndex = (this.currentSlide === this.slidesCount) ? 1 : this.currentSlide + 1;

        // TIZEN 4 (single decoder): back layer was loaded WITHOUT video.
        // If next slide needs a video, skip back layer and use showSlide()
        // which properly kills old → creates new → shows at opacity 1.
        if (!this._dualDecoder && this._backVideoItem) {
            Logger.info("Single decoder: next slide has video, using showSlide fallback.");
            this._cleanupBack();
            this.currentSlide = nextIndex;
            this.showSlide(this.currentSlide);
            return;
        }

        if (backContainer && this._backSlideIndex === nextIndex) {
            this.currentSlide = nextIndex;
            var oldVideo = this.videoElement;
            var backVideoItem = this._backVideoItem;
            this.videoElement = this._backVideoElement;
            this._backContainer = null;
            this._backVideoElement = null;
            this._backSlideIndex = -1;
            this._backVideoItem = null;

            var self = this;
            var hasOldVideo = !!oldVideo;
            var hasNewVideo = !!this.videoElement;

            var promoteBack = function () {
                if (self._stopped) return;
                backContainer.id = "content-wrap";
                backContainer.style.zIndex = "2";
                backContainer.style.pointerEvents = "";

                // Unmute and resume back video (it was paused after warm-up)
                if (self.videoElement) {
                    self.videoElement.muted = self._backVideoOriginalMuted;
                    try { self.videoElement.play(); } catch (e) {}
                }

                Logger.info("Transition complete.", { currentSlide: self.currentSlide });
                var slideData = self.slides[self.currentSlide - 1];
                self.slideDuration = (slideData.duration || 5) * 1000;
                self._startTimerAndLoadBack();
            };

            if (hasOldVideo && hasNewVideo && self._dualDecoder) {
                // DUAL DECODER (Tizen 7+): instant hide + delayed destruction
                Logger.info("Video→Video [dual]: instant hide + delayed destroy.");

                if (frontContainer) {
                    frontContainer.style.transition = "none";
                    frontContainer.style.opacity = "0";
                    frontContainer.style.zIndex = "-1";
                }

                promoteBack();

                setTimeout(function () {
                    self._killVideo(oldVideo);
                    if (frontContainer) frontContainer.remove();
                }, 300);

            } else {
                // Non-video transition: 300ms crossfade
                if (frontContainer) {
                    frontContainer.style.transition = "opacity 0.3s ease-in-out";
                    frontContainer.style.opacity = "0";
                }
                setTimeout(function () {
                    if (self._stopped) return;
                    if (oldVideo) {
                        try { oldVideo.pause(); } catch (e) {}
                    }
                    if (frontContainer) frontContainer.remove();
                    promoteBack();
                }, 300);
            }
        } else {
            // No back layer ready — fall back: create slide from scratch
            this._cleanupBack();
            this.currentSlide = nextIndex;
            this.showSlide(this.currentSlide);
        }
    }

    // Fallback: show slide from scratch (used when back layer isn't ready)
    showSlide(slideIndex) {
        Logger.info("showSlide (fallback)", { slideIndex: slideIndex });
        if (this._stopped) return;
        if (!this.slides || this.slides.length === 0 || slideIndex > this.slides.length) {
            Logger.error("Invalid slide index or no slides available", { slideIndex: slideIndex });
            return;
        }

        if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }

        var slideData = this.slides[slideIndex - 1];
        this.slideDuration = (slideData.duration || 5) * 1000;

        var currentContainer = document.getElementById("content-wrap");

        // Create next on top at opacity 0
        var nextContainer = this._createContainer("next-content-wrap", "3");
        if (currentContainer) {
            currentContainer.parentNode.insertBefore(nextContainer, currentContainer.nextSibling);
        } else {
            document.body.appendChild(nextContainer);
        }

        var oldVideo = this.videoElement;
        this.videoElement = null;
        var self = this;

        if (!this._dualDecoder) {
            // TIZEN 4 (single decoder): kill old video, wait for decoder
            // release, then create new video.
            // 1. Kill old video to free the single decoder
            if (oldVideo) {
                Logger.info("showSlide: killing old video before populate (single decoder).");
                this._killVideo(oldVideo);
                oldVideo = null;
            }
            // 2. Remove old container immediately
            if (currentContainer) currentContainer.remove();
            // 3. Append next container to DOM and show at opacity 1
            //    (hole-punch can't render through opacity-0 parent)
            document.body.appendChild(nextContainer);
            nextContainer.id = "content-wrap";
            nextContainer.style.zIndex = "2";
            nextContainer.style.opacity = "1";
            // 4. Wait 500ms for Tizen 4 to release the single decoder,
            //    then create and populate the new video element.
            setTimeout(function () {
                if (self._stopped) return;
                self._populateContainer(nextContainer, slideData.items);
                Logger.info("showSlide: delayed populate done (single decoder).", { slideIndex: slideIndex });
                self._startTimerAndLoadBack();
            }, 500);
        } else {
            // TIZEN 7 (dual decoder): crossfade transition
            this._populateContainer(nextContainer, slideData.items);

            this._waitForMedia(nextContainer, function () {
                nextContainer.style.transition = "opacity 0.3s ease-in-out";
                nextContainer.style.opacity = "1";
                if (currentContainer) {
                    currentContainer.style.transition = "opacity 0.3s ease-in-out";
                    currentContainer.style.opacity = "0";
                }

                setTimeout(function () {
                    if (self._stopped) return;
                    if (currentContainer) currentContainer.remove();
                    nextContainer.id = "content-wrap";
                    nextContainer.style.zIndex = "2";

                    if (oldVideo) {
                        try { oldVideo.pause(); } catch (e) {}
                    }

                    self._startTimerAndLoadBack();
                }, 300);
            });
        }
    }

    // ─── Back layer loading ──────────────────────────────────────────

    _loadBackLayer() {
        if (this._stopped) return;
        if (this.slidesCount <= 1) return;

        var nextIndex = (this.currentSlide === this.slidesCount) ? 1 : this.currentSlide + 1;
        if (this._backSlideIndex === nextIndex) return;

        this._cleanupBack();

        Logger.info("Loading back layer.", { nextIndex: nextIndex, dualDecoder: this._dualDecoder });
        var slideData = this.slides[nextIndex - 1];

        // Create back layer: z-index 1 (BEHIND front which is z-index 2)
        var container = this._createContainer("back-content-wrap", "1");
        container.style.pointerEvents = "none";
        if (this._dualDecoder) {
            // DUAL DECODER: opacity MUST be 1 so Tizen decoder renders frames
            container.style.opacity = "1";
        } else {
            // SINGLE DECODER: keep hidden (opacity 0) to avoid blocking
            // hole-punch video rendering. Images still preload in DOM.
            container.style.opacity = "0";
        }
        document.body.appendChild(container);

        // Populate (this sets this.videoElement temporarily)
        var savedVideo = this.videoElement;
        this.videoElement = null;
        this._backVideoItem = null;

        if (this._dualDecoder) {
            // DUAL DECODER: populate everything including video
            this._populateContainer(container, slideData.items);
        } else {
            // SINGLE DECODER: populate everything EXCEPT video.
            // Save video item data for src-swap at transition time.
            this._populateContainer(container, slideData.items, true);
        }

        this._backVideoElement = this.videoElement;
        this.videoElement = savedVideo;

        // Mute back layer video so user doesn't hear it
        if (this._backVideoElement) {
            this._backVideoOriginalMuted = this._backVideoElement.muted;
            this._backVideoElement.muted = true;

            // DUAL DECODER: let video autoplay to warm decoder,
            // then pause so it doesn't advance past frame 0.
            // promoteBack() will call play() to resume.
            var backVid = this._backVideoElement;
            if (!backVid.paused && backVid.readyState >= 3) {
                backVid.pause();
                Logger.info("Back video paused after warm-up (immediate).");
            } else {
                backVid.addEventListener("playing", function onP() {
                    backVid.removeEventListener("playing", onP);
                    backVid.pause();
                    Logger.info("Back video paused after warm-up (event).");
                });
            }
        }

        this._backContainer = container;
        this._backSlideIndex = nextIndex;
        Logger.info("Back layer created.", { nextIndex: nextIndex, hasBackVideo: !!this._backVideoElement, hasBackVideoItem: !!this._backVideoItem });
    }

    // Resolve and set a video element's src (handles local Tizen paths)
    // Optional callback fires after src is actually set
    _setVideoSrc(vid, loc, callback) {
        var cb = callback || function () {};
        if (loc.indexOf("http://") === 0 || loc.indexOf("https://") === 0) {
            vid.src = loc;
            Logger.info("Video src set directly (HTTP).", { src: loc });
            cb();
        } else {
            try {
                if (typeof tizen !== 'undefined' && tizen.filesystem) {
                    tizen.filesystem.resolve(
                        loc,
                        function (file) {
                            var uri = tizen.filesystem.toURI(file.fullPath);
                            vid.src = uri;
                            Logger.info("Video src set from filesystem URI.", { uri: uri });
                            cb();
                        },
                        function (err) {
                            Logger.error("Video resolve error.", { error: err.message });
                            vid.src = loc;
                            cb();
                        },
                        "r"
                    );
                } else {
                    vid.src = loc;
                    cb();
                }
            } catch (e) {
                vid.src = loc;
                cb();
            }
        }
    }

    // Fully destroy a video element and release its decoder
    _killVideo(vid) {
        if (!vid) return;
        try { vid.pause(); } catch (e) {}
        try { vid.src = ""; vid.load(); } catch (e) {}
        try { if (vid.parentNode) vid.parentNode.removeChild(vid); } catch (e) {}
    }

    _cleanupBack() {
        if (this._backContainer) {
            var vid = this._backContainer.querySelector("video");
            this._killVideo(vid);
            this._backContainer.remove();
            this._backContainer = null;
            this._backVideoElement = null;
            this._backSlideIndex = -1;
            this._backVideoItem = null;
        }
    }

    // ─── Helper: create a container div ──────────────────────────────

    _createContainer(id, zIndex) {
        var container = document.createElement("div");
        container.id = id;
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.opacity = "0";
        container.style.zIndex = zIndex;
        return container;
    }

    // ─── Wait for media ready ────────────────────────────────────────

    _waitForMedia(container, onReady) {
        var self = this;
        var done = false;

        var finish = function () {
            if (done) return;
            done = true;
            onReady();
            self._startTimerAndLoadBack();
        };

        var imgs = container.querySelectorAll("img");
        var vids = container.querySelectorAll("video");
        var total = imgs.length + vids.length;

        if (total === 0) { finish(); return; }

        var loaded = 0;
        var check = function () { if (++loaded >= total) finish(); };

        for (var i = 0; i < imgs.length; i++) {
            (function (img) {
                if (img.complete) { check(); }
                else {
                    img.onload = check;
                    img.onerror = check;
                }
            })(imgs[i]);
        }

        for (var v = 0; v < vids.length; v++) {
            (function (vid) {
                if (!vid.paused && vid.readyState >= 3) { check(); }
                else {
                    vid.addEventListener("playing", function onP() {
                        vid.removeEventListener("playing", onP);
                        check();
                    });
                    vid.onerror = check;
                }
            })(vids[v]);
        }

        // Safety timeout
        setTimeout(function () { finish(); }, 5000);
    }

    // ─── Timer + back layer ──────────────────────────────────────────

    _startTimerAndLoadBack() {
        // Start the slide timer
        this.slideStartTime = performance.now();
        this.isSlidePlaying = true;
        var self = this;

        // Pre-load back layer (dual-decoder only).
        // On single-decoder (Tizen 4), skip entirely — back layer
        // would interfere with hole-punch video rendering.
        if (self._dualDecoder) {
            setTimeout(function () {
                if (!self._stopped && self.isSlidePlaying) {
                    self._loadBackLayer();
                }
            }, 1000);
        }

        var tick = function (timestamp) {
            if (!self.isSlidePlaying) return;
            if (timestamp - self.slideStartTime >= self.slideDuration) {
                self.isSlidePlaying = false;
                self._transitionToNext();
            } else {
                self.animationFrameId = requestAnimationFrame(tick);
            }
        };

        this.animationFrameId = requestAnimationFrame(tick);
    }

    // ─── Populate container ──────────────────────────────────────────

    _populateContainer(container, slideItems, skipVideo) {
        if (this.isGlobalString) {
            container.appendChild(this.addTextElement(this.globalSlide));
        }
        for (var i = 0; i < slideItems.length; i++) {
            var item = slideItems[i];
            var element = null;
            switch (item.type_content) {
                case "text":
                case "globaltext":
                    element = this.addTextElement(item);
                    break;
                case "video":
                    if (skipVideo) {
                        // Single-decoder: save item data, don't create element
                        this._backVideoItem = item;
                        Logger.info("Skipping video in back layer (single decoder).", { location: item.attr.location });
                    } else {
                        element = this.addVideoElement(item);
                        this.videoElement = element;
                    }
                    break;
                case "image":
                    element = this.addImageElement(item);
                    break;
                case "site":
                    element = this.addURLElement(item);
                    break;
                case "table":
                    element = this.addTableElement(item);
                    break;
            }
            if (element) container.appendChild(element);
        }
    }

    // ─── Go to next slide ────────────────────────────────────────────

    goToNextSlide() {
        Logger.info("goToNextSlide", { currentSlide: this.currentSlide, totalSlides: this.slidesCount });

        // Single-slide video: replay in-place
        if (this.slidesCount === 1 && this.videoElement) {
            try { this.videoElement.currentTime = 0; } catch (e) {}
            try { this.videoElement.play(); } catch (e) {}
            this._startTimerAndLoadBack();
            return;
        }

        this._transitionToNext();
    }

    // ─── Element creation methods ────────────────────────────────────
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
        var loc = element.attr.location;
        var needsExplicitPlay = !this._dualDecoder; // Tizen 4: autoplay won't re-trigger after async src
        let elementWrap = document.createElement("video");
        // DO NOT set src yet — bare Tizen paths cause 404 → onerror → premature crossfade
        elementWrap.id = "video-" + Date.now();
        elementWrap.setAttribute("data-tizen-video", "true");
        elementWrap.setAttribute("type", "video/mp4");
        elementWrap.setAttribute("autoplay", "");
        elementWrap.controls = false;
        elementWrap.setAttribute("playsinline", "");
        elementWrap.setAttribute("preload", "auto");
        if(element.attr.ismute) {
            elementWrap.muted = true;
            elementWrap.setAttribute("muted", "");
            Logger.info("Video element set to muted."); //
        }
        elementWrap.style.position = "absolute";
        elementWrap.style.top = element.top + "px";
        elementWrap.style.left = element.left + "px";
        elementWrap.style.fontSize = "14px";
        elementWrap.style.height = "100%";
        elementWrap.style.zIndex = element.index;
        elementWrap.style.width = "100%";

        // Set src based on platform and path type
        if (loc.indexOf("http://") === 0 || loc.indexOf("https://") === 0) {
            elementWrap.src = loc;
            Logger.info("Video src set directly (HTTP URL).", { src: loc }); //
        } else if (needsExplicitPlay) {
            // TIZEN 4 (single decoder): convert path to file:// URI synchronously
            // using tizen.filesystem.toURI(), then set src and play on canplay.
            // The async tizen.filesystem.resolve() causes timing issues on Tizen 4.
            var videoSrc = loc;
            try {
                if (typeof tizen !== 'undefined' && tizen.filesystem && tizen.filesystem.toURI) {
                    videoSrc = tizen.filesystem.toURI(loc);
                    Logger.info("Video src converted via toURI (single decoder).", { raw: loc, uri: videoSrc });
                }
            } catch (e) {
                Logger.warn("toURI failed, using raw path.", { error: e.message, path: loc });
            }
            elementWrap.src = videoSrc;
            // Play when enough data is loaded (element may not be in DOM yet)
            var shouldMute = !!element.attr.ismute;
            elementWrap.addEventListener("canplay", function onCanPlay() {
                elementWrap.removeEventListener("canplay", onCanPlay);
                // Re-enforce mute before play — Tizen 4 Chromium can reset it
                if (shouldMute) elementWrap.muted = true;
                try { elementWrap.play(); } catch (e) {
                    Logger.warn("play() on canplay failed (single decoder).", { error: e.message });
                }
                Logger.info("Video play() called on canplay event (single decoder).", { muted: elementWrap.muted });
            });
            Logger.info("Video src set (single decoder).", { src: videoSrc });
        } else {
            // TIZEN 7 (dual decoder): async resolve works fine here
            try {
                if (typeof tizen !== 'undefined' && tizen.filesystem) {
                    Logger.info("Resolving video file via Tizen filesystem to get URI."); //
                    tizen.filesystem.resolve(
                        loc,
                        function (file) {
                            var uri = tizen.filesystem.toURI(file.fullPath);
                            elementWrap.src = uri;
                            Logger.info("Video src set from filesystem URI.", { uri: uri }); //
                        },
                        function (err) {
                            console.error("Video resolve error:", err.message);
                            Logger.error("Error resolving video file path.", { error: err.message }); //
                            elementWrap.src = loc;
                        },
                        "r"
                    );
                } else {
                    elementWrap.src = loc;
                }
            } catch (e) {
                console.error("Unexpected error during video element setup:", e.message);
                Logger.error("Unexpected exception in addVideoElement.", { error: e.message }); //
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
        elementWrap.style.fontSize = "14px";
        elementWrap.style.height = "100%";
        elementWrap.style.zIndex = element.index;
        elementWrap.style.width = "100%";
        elementWrap.src = element.attr.location;
        Logger.info("Image element created with src.", { src: element.attr.location }); //
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

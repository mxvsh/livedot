(function () {
  var el = document.currentScript;
  var W = el.dataset.website;
  if (!W) return;

  var E = el.src.replace(/\/t\.js$/, "");
  var S = localStorage.getItem("_livedot_sid");
  if (!S) {
    S = crypto.randomUUID();
    localStorage.setItem("_livedot_sid", S);
  }

  function send() {
    var d = JSON.stringify({ websiteId: W, sessionId: S, url: location.href });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(E + "/api/event", d);
    } else {
      fetch(E + "/api/event", { method: "POST", body: d, keepalive: true });
    }
  }

  function sendEvent(eventName) {
    var d = JSON.stringify({ websiteId: W, sessionId: S, url: location.href, eventName: eventName });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(E + "/api/event", d);
    } else {
      fetch(E + "/api/event", { method: "POST", body: d, keepalive: true });
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var umami = t && t.closest("[data-umami-event]");
    if (umami) sendEvent(umami.getAttribute("data-umami-event"));
    var livedot = t && t.closest("[data-livedot-event]");
    if (livedot) sendEvent(livedot.getAttribute("data-livedot-event"));
  });

  // Expose window.livedot.track(eventName)
  window.livedot = { track: function (name) { if (typeof name === "string") sendEvent(name); } };

  // If umami exists, patch its track fn to also send to livedot
  function patchUmami(u) {
    if (!u || u._livedot) return;
    if (!u.track) {
      var attempts = 0;
      var poll = setInterval(function () {
        attempts++;
        if (u.track) {
          clearInterval(poll);
          doPatch(u);
        } else if (attempts > 20) {
          clearInterval(poll);
        }
      }, 200);
      return;
    }
    doPatch(u);
  }

  function doPatch(u) {
    var orig = u.track.bind(u);
    u.track = function () {
      orig.apply(u, arguments);
      var name = arguments[0];
      if (typeof name === "string") sendEvent(name);
      else if (name && typeof name === "object" && name.name) sendEvent(name.name);
    };
    u._livedot = true;
  }

  if (window.umami) {
    patchUmami(window.umami);
  } else {
    var _val = undefined;
    Object.defineProperty(window, "umami", {
      configurable: true,
      get: function () { return _val; },
      set: function (v) { _val = v; patchUmami(v); },
    });
  }

  send();
  var timer = setInterval(send, 25000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      send();
      timer = setInterval(send, 25000);
    } else {
      clearInterval(timer);
    }
  });
})();

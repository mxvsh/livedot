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

  send();
  setInterval(send, 5000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") send();
  });
})();

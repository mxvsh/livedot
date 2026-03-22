(function () {
  var el = document.currentScript;
  var P = el.dataset.project;
  if (!P) return;

  var E = el.src.replace(/\/t\.js$/, "");
  var S = localStorage.getItem("_latty_sid");
  if (!S) {
    S = crypto.randomUUID();
    localStorage.setItem("_latty_sid", S);
  }

  function send() {
    var d = JSON.stringify({ projectId: P, sessionId: S, url: location.href });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(E + "/api/event", d);
    } else {
      fetch(E + "/api/event", { method: "POST", body: d, keepalive: true });
    }
  }

  send();
  setInterval(send, 25000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") send();
  });
})();

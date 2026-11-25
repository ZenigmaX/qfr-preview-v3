/* QFR draft helpers: quote wizard, before/after slider, Retell placeholders. No keys, no endpoint. */
(function () {
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Before/after slider */
  $$(".ba").forEach(function (ba) {
    var range = $("input[type=range]", ba);
    var before = $(".ba-before", ba);
    var handle = $(".ba-handle", ba);
    if (!range || !before) return;
    var apply = function () {
      var v = range.value || 50;
      before.style.width = v + "%";
      if (handle) handle.style.left = v + "%";
    };
    range.addEventListener("input", apply);
    apply();
  });

  /* Retell placeholders: voice vs text */
  var dock = $(".assist-dock");
  if (dock) {
    var setMode = function (mode) {
      dock.classList.remove("open-voice", "open-chat");
      if (mode) dock.classList.add("open-" + mode);
      $$("[data-assist-open]", dock).forEach(function (b) {
        b.setAttribute("aria-expanded", b.getAttribute("data-assist-open") === mode ? "true" : "false");
      });
    };
    $$("[data-assist-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-assist-open");
        var already = dock.classList.contains("open-" + mode);
        setMode(already ? null : mode);
      });
    });
    $$("[data-assist-close]", dock).forEach(function (btn) {
      btn.addEventListener("click", function () { setMode(null); });
    });
  }

  /* Multi-step quote wizard */
  var wiz = $(".wizard");
  if (!wiz) return;
  var form = $("form", wiz);
  var steps = $$(".wiz-step", wiz);
  var bar = $(".progress > span", wiz);
  var count = $(".wiz-count", wiz);
  var idx = 0;
  var params = new URLSearchParams(window.location.search);

  function preselect(name, value) {
    if (!value) return;
    var input = form.querySelector('[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
    var select = form.querySelector('select[name="' + name + '"]');
    if (select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === value) select.selectedIndex = i;
      }
    }
  }
  preselect("service", params.get("service"));
  preselect("problem", params.get("problem"));
  preselect("property_type", params.get("property_type"));

  var source = $("#source-url", form);
  if (source && !source.value) source.value = window.location.pathname;

  function labelFor(name) {
    var checked = form.querySelector('[name="' + name + '"]:checked');
    if (checked) {
      var lab = checked.closest("label");
      return (lab && lab.querySelector("strong") ? lab.querySelector("strong").textContent : checked.value);
    }
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return "";
    if (el.tagName === "SELECT") {
      var opt = el.options[el.selectedIndex];
      return opt && opt.value ? opt.textContent : "";
    }
    return el.value || "";
  }

  function filesNote() {
    var f = $("#photos", form);
    if (!f || !f.files || !f.files.length) return "None attached on this draft";
    return f.files.length + (f.files.length === 1 ? " file selected" : " files selected");
  }

  function fillSummary() {
    var map = {
      "sum-service": labelFor("service"),
      "sum-problem": labelFor("problem"),
      "sum-ptype": labelFor("property_type"),
      "sum-photos": filesNote(),
      "sum-address": [labelFor("address"), labelFor("city")].filter(Boolean).join(", "),
      "sum-timing": [labelFor("timing"), labelFor("timing_dates")].filter(Boolean).join(" — "),
      "sum-contact": [labelFor("name"), labelFor("phone"), labelFor("email")].filter(Boolean).join(" · ")
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id] || "Not provided yet";
    });
  }

  function show(i) {
    if (i < 0) i = 0;
    if (i >= steps.length) i = steps.length - 1;
    idx = i;
    steps.forEach(function (s, n) { s.classList.toggle("is-on", n === idx); });
    if (bar) bar.style.width = ((idx + 1) / steps.length * 100) + "%";
    if (count) count.textContent = "Step " + (idx + 1) + " of " + steps.length;
    if (steps[idx] && steps[idx].id === "wiz-summary") fillSummary();
    if (wiz._userStepped) wiz.scrollIntoView({ block: "nearest" });
  }

  wiz.addEventListener("click", function (e) {
    var next = e.target.closest("[data-next]");
    var prev = e.target.closest("[data-prev]");
    if (next) { e.preventDefault(); wiz._userStepped = true; show(idx + 1); }
    if (prev) { e.preventDefault(); wiz._userStepped = true; show(idx - 1); }
  });

  if (params.get("service") || params.get("problem") || window.location.hash === "#quote") {
    var firstEmpty = 0;
    if (params.get("service")) firstEmpty = 1;
    if (params.get("service") && params.get("problem")) firstEmpty = 2;
    show(firstEmpty);
  } else {
    show(0);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var hp = form.querySelector(".hp input");
    if (hp && hp.value) return;
    fillSummary();
    var status = $("#form-status", form);
    if (status) {
      status.classList.add("is-visible");
      status.focus();
    }
  });
})();

(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");

  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1000) setMenu(false);
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  /* Horizontal rails with desktop arrows */
  document.querySelectorAll("[data-rail]").forEach(function (rail) {
    var group = rail.closest("section") || document;
    var prev = group.querySelector('[data-rail-prev]');
    var next = group.querySelector('[data-rail-next]');
    if (!prev || !next) return;

    function step() {
      var first = rail.firstElementChild;
      return first ? first.getBoundingClientRect().width + 14 : rail.clientWidth * 0.8;
    }

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
    }

    prev.addEventListener("click", function () {
      rail.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      rail.scrollBy({ left: step(), behavior: "smooth" });
    });
    rail.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    sync();
  });

  /* Active service in the sticky index */
  var indexLinks = Array.prototype.slice.call(document.querySelectorAll(".svc-index a"));
  if (indexLinks.length && "IntersectionObserver" in window) {
    var sections = indexLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          indexLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveals.forEach(function (node) {
        node.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      reveals.forEach(function (node) {
        io.observe(node);
      });
    }
  }

  /* Enquiry form */
  var form = document.querySelector("#enquiry");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var serviceField = form.querySelector("#service");
  var placeField = form.querySelector("#destination");
  var service = params.get("service");
  var place = params.get("place");

  if (service && serviceField && serviceField.querySelector('option[value="' + service + '"]')) {
    serviceField.value = service;
  }
  if (place && placeField) placeField.value = place;

  var confirmBox = document.querySelector("#confirm");
  var summary = document.querySelector("#summary");
  var copyButton = document.querySelector("#copy-enquiry");
  var editButton = document.querySelector("#edit-enquiry");

  function fieldError(id, message) {
    var input = form.querySelector("#" + id);
    var error = form.querySelector("#" + id + "-error");
    if (!input || !error) return;
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function value(id) {
    var input = form.querySelector("#" + id);
    return input ? input.value.trim() : "";
  }

  function enquiryText() {
    var serviceLabel = serviceField && serviceField.selectedOptions.length
      ? serviceField.selectedOptions[0].textContent
      : value("service");
    return [
      "Drive Quick Travels enquiry",
      "Name: " + value("name"),
      "Phone: " + value("phone"),
      "Email: " + (value("email") || "—"),
      "Service: " + serviceLabel,
      "Destination: " + (value("destination") || "—"),
      "Dates: " + (value("dates") || "—"),
      "Travellers: " + (value("travellers") || "—"),
      "Message: " + (value("message") || "—")
    ].join("\n");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var valid = true;

    if (!value("name")) {
      fieldError("name", "Add your name.");
      valid = false;
    } else {
      fieldError("name", "");
    }

    if (value("phone").replace(/\D/g, "").length < 8) {
      fieldError("phone", "Add a phone number we can reach.");
      valid = false;
    } else {
      fieldError("phone", "");
    }

    if (value("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) {
      fieldError("email", "Check the email address, or leave it blank.");
      valid = false;
    } else {
      fieldError("email", "");
    }

    if (!value("service")) {
      fieldError("service", "Choose what you need help with.");
      valid = false;
    } else {
      fieldError("service", "");
    }

    if (!valid) {
      var firstInvalid = form.querySelector("[aria-invalid='true']");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var text = enquiryText();
    if (summary) summary.textContent = text;
    var waLink = document.querySelector("#send-whatsapp");
    if (waLink) {
      waLink.href = waLink.getAttribute("data-wa-base") + "?text=" + encodeURIComponent(text);
    }
    form.hidden = true;
    if (confirmBox) {
      confirmBox.hidden = false;
      confirmBox.focus();
    }
  });

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var text = summary ? summary.textContent : "";
      function done(ok) {
        copyButton.textContent = ok ? "Copied" : "Copy failed — select the text";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  }

  if (editButton) {
    editButton.addEventListener("click", function () {
      if (confirmBox) confirmBox.hidden = true;
      form.hidden = false;
      var name = form.querySelector("#name");
      if (name) name.focus();
    });
  }
})();

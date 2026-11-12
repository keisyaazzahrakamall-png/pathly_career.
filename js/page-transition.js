const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
  document.documentElement.classList.add("page-transitions");

  window.requestAnimationFrame(function () {
    document.body.classList.add("page-entered");
  });

  window.addEventListener("pageshow", function () {
    document.body.classList.add("page-entered");
    document.body.classList.remove("page-leaving");
  });

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[href]");

    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    const destination = new URL(link.href, window.location.href);
    const isSamePageAnchor =
      destination.pathname === window.location.pathname &&
      destination.search === window.location.search &&
      destination.hash;

    if (destination.origin !== window.location.origin || isSamePageAnchor) {
      return;
    }

    event.preventDefault();
    document.body.classList.add("page-leaving");

    window.setTimeout(function () {
      window.location.assign(destination.href);
    }, 140);
  });
}

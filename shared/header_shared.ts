const headerContainer = document.getElementById("header");

fetch("/shared/header_shared.html")
  .then(res => res.text())
  .then(html => {
    headerContainer.innerHTML = html;

    document.getElementById("GH")?.addEventListener("click", () => {
      window.open("https://github.com/Gabrax", "_blank");
    });

    document.getElementById("LI")?.addEventListener("click", () => {
      window.open(
        "https://www.linkedin.com/in/gabriel-ozeg-136481200/",
        "_blank"
      );
    });

    const links = headerContainer.querySelectorAll('.link a[data-page]');
    links.forEach(link => {
      // Compare pathname without trailing slash
      const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
      const currentPath = window.location.pathname.replace(/\/$/, "");
      if (linkPath === currentPath) {
        link.classList.add("active");
      }
    });
  })
  .catch(err => console.error("Header load failed:", err));

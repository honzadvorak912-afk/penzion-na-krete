/* site.js – sdílené chování (burger menu, rok v patičce) */
document.addEventListener("DOMContentLoaded", function () {
  // Burger menu
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      burger.classList.toggle("active", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    });
    // Zavřít menu po kliknutí na odkaz (mobil)
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        burger.classList.remove("active");
        document.body.classList.remove("nav-open");
      })
    );
  }

  // Aktuální rok v patičce
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
});

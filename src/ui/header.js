/**
 * En-tête : page courante (aria-current) et état « défilé » (fond plein
 * dès qu'on quitte le haut de page, pour rester lisible sur les images).
 */
export function initHeader() {
  const header = document.querySelector('.header');
  const page = document.body.dataset.page;
  document.querySelectorAll('.header__nav [data-nav], .menu__nav [data-nav]').forEach((a) => {
    if (a.dataset.nav === page) { a.setAttribute('aria-current', 'page'); a.classList.add('is-active'); }
  });
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

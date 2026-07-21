(() => {
  const logoUrl = 'assets/brand/basiskele-belediyesi-logo.svg';

  document.querySelectorAll('img[alt*="Başiskele"], img[alt*="Belediyesi"]').forEach((image) => {
    if (!image.getAttribute('src')) image.setAttribute('src', logoUrl);
    image.setAttribute('loading', image.getAttribute('loading') || 'lazy');
    image.setAttribute('decoding', image.getAttribute('decoding') || 'async');
  });
})();

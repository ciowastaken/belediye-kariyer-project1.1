(() => {
  const logoUrl = 'https://www.upload.ee/image/19288734/logo_07042021153953.png';

  document.querySelectorAll('img[alt*="Başiskele"], img[alt*="Belediyesi"]').forEach((image) => {
    if (!image.getAttribute('src')) image.setAttribute('src', logoUrl);
    image.setAttribute('loading', image.getAttribute('loading') || 'lazy');
    image.setAttribute('decoding', image.getAttribute('decoding') || 'async');
  });
})();

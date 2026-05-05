// js/slider.js - SON ve KESİN ÇÖZÜM

document.addEventListener('DOMContentLoaded', function () {
  const listingsContainer = document.getElementById('listings-container');
  if (!listingsContainer) {
      console.warn('listings-container elementi bulunamadı.'); // Konsola uyarı ekle
      return;
  }

  // getAllListings fonksiyonunun tanımlı olduğunu varsayıyoruz (örn: job-data-manager.js'den geliyor)
  const listings = getAllListings(); 

  if (listings.length === 0) {
      listingsContainer.innerHTML = '<div class="alert alert-info">Henüz ilan bulunmamaktadır.</div>';
      return;
  }

  // Slider yapısını oluşturmadan önce container'ı temizle ve temel slider HTML'ini ekle
  listingsContainer.innerHTML = `
  <div id="jobSliderControls" class="carousel slide" data-bs-ride="carousel" data-bs-interval="8000" data-bs-pause="hover">
      <div class="carousel-inner" id="slider-items"></div>
      <button class="carousel-control-prev" type="button" data-bs-target="#jobSliderControls" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Geri</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#jobSliderControls" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">İleri</span>
      </button>
  </div>
  `;

  const sliderContainer = document.getElementById('slider-items');
  // Her slaytta gösterilecek ilan sayısı
  const itemsPerSlide = 3; 

  for (let i = 0; i < listings.length; i += itemsPerSlide) {
      const slideListings = listings.slice(i, i + itemsPerSlide);
      // İlk slayt aktif olacak
      const isActive = i === 0 ? 'active' : '';

      let slideHtml = `
      <div class="carousel-item ${isActive}">
          <div class="row justify-content-center align-items-stretch">`;

      slideListings.forEach(listing => {
          // İlan tipi ve isim kontrolü
          const typeText = listing.type === 'employer' ? 'İşveren' : 'İş Arayan';
          const typeClass = listing.type === 'employer' ? 'employer' : 'job-seeker';
          const posterNameSafe = listing.posterName || listing.name || 'İsim Belirtilmemiş';

          slideHtml += `
          <div class="col-lg-4 col-md-6 d-flex mb-4">
              <div class="job-card uniform-height animate__animated animate__fadeInUp w-100 d-flex flex-column">
                  <div class="card-header">
                      <span class="job-type ${typeClass}">
                          ${typeText}
                      </span>
                      ${listing.dailyWage ? `<span class="daily-wage">${listing.dailyWage}</span>` : ''}
                  </div>
                  <div class="card-body d-flex flex-column">
                      <h5 class="card-title job-title">${listing.title}</h5>
                      <p class="poster-name"><i class="fas fa-user-tie"></i> ${posterNameSafe}</p>
                      <p class="job-description">${listing.description}</p>
                      <p class="job-location"><i class="fas fa-map-marker-alt"></i> ${listing.location}</p>
                      <p class="job-date"><i class="fas fa-calendar-alt"></i> ${listing.date}</p>
                  </div>
                  <div class="card-footer">
                      <a href="mailto:${listing.contact}" class="btn btn-contact">
                          <i class="fas fa-envelope"></i> İletişime Geç
                      </a>
                  </div>
              </div>
          </div>`;
      });

      slideHtml += `
          </div>
      </div>`;
      sliderContainer.innerHTML += slideHtml;
  }
});

// getAllListings fonksiyonunun job-data-manager.js dosyasından geldiği varsayılıyor.
// Örnek bir getAllListings fonksiyonu (varsa kendi dosyanızdan alacaktır):
/*
function getAllListings() {
  // Burada ilanları bir yerden (örneğin localStorage'dan) çekme mantığı olacak
  const listings = JSON.parse(localStorage.getItem('jobListings')) || [];
  return listings;
}
*/
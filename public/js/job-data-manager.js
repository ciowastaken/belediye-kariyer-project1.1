// js/job-data-manager.js

// Local Storage için anahtar sabiti
const LISTINGS_STORAGE_KEY = 'jobListings';

// Varsayılan 15 sahte ilan (Bu liste sadece Local Storage boşsa kullanılacak)
const defaultListings = [
   
];

/**
 * LocalStorage'a ilanları kaydet.
 * @param {Array<Object>} listings - Kaydedilecek ilanların listesi.
 */
export function saveListings(listings) {
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(listings));
}

/**
 * LocalStorage'dan tüm ilanları getir. Eğer LocalStorage boşsa, varsayılan ilanları yükler.
 * @returns {Array<Object>} Tüm ilanların listesi.
 */
export function getAllListings() {
    const stored = localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (stored) {
        // Eğer Local Storage'da veri varsa, onu kullan
        return JSON.parse(stored);
    } else {
        // Local Storage boşsa, varsayılan ilanları yükle ve kaydet
        // Bu kısım sadece ilk yüklemede veya Local Storage tamamen boşaltıldığında çalışır
        saveListings(defaultListings);
        return defaultListings;
    }
}

/**
 * Yeni bir ilanı listeye ekler ve LocalStorage'a kaydeder.
 * Yeni ilanlar listenin başına eklenir (unshift).
 * @param {Object} newItem - Eklenecek yeni ilan objesi.
 */
export function addListing(newItem) {
    const all = getAllListings(); // Mevcut ilanları al
    all.unshift(newItem); // Yeni ilanı listenin başına ekle
    saveListings(all); // Değişiklikleri Local Storage'a kaydet
    console.log('Yeni ilan başarıyla eklendi ve kaydedildi:', newItem);
}

/**
 * Belirtilen ID'ye sahip ilanı listeden siler ve LocalStorage'ı günceller.
 * @param {string} id - Silinecek ilanın ID'si.
 */
export function deleteListingById(id) {
    // Mevcut ilanları al, silinecek olanı filtrele ve yeni listeyi kaydet
    let all = getAllListings().filter(listing => listing.id !== id);
    saveListings(all);
    console.log(`İlan silindi: ID ${id}`);
}
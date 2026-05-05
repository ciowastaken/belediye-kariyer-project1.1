// js/post-ad.js

document.addEventListener('DOMContentLoaded', function() {
    const adForm = document.getElementById('adForm');
    const formMessage = document.getElementById('formMessage');
    const dailyWageField = document.getElementById('dailyWageField');
    const dateField = document.getElementById('date');

    // Başlangıçta gizle ve tarihi ata
    formMessage.style.display = 'none';
    if (dateField) dateField.value = new Date().toLocaleDateString('tr-TR');

    // İlk yüklemede günlük ücret alanını göster/gizle
    const initialType = document.querySelector('input[name="adType"]:checked')?.value;
    dailyWageField.style.display = initialType === 'daily' ? 'block' : 'none';

    adForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // Form verilerini al
        const adTitle = document.getElementById('adTitle').value.trim();
        const adDescription = document.getElementById('adDescription').value.trim();
        const posterName = document.getElementById('posterName').value.trim();
        const adLocation = document.getElementById('adLocation').value.trim();
        const workType = document.getElementById('workType').value;
        const dailyWage = document.getElementById('dailyWage').value.trim();
        const adType = document.querySelector('input[name="adType"]:checked').value;
        const date = new Date().toLocaleDateString('tr-TR');
        // Form verilerini doğrula
        if (!adTitle || !adDescription || !posterName || !adLocation || !workType) {
            showFormMessage('Lütfen tüm alanları doldurun.', 'danger');
            return;
        }
        if (adType === 'daily' && !dailyWage) {
            showFormMessage('Günlük ücret alanını doldurun.', 'danger');
            return;
        }
        // Form verilerini JSON formatında hazırla
        const adData = {
            adTitle,
            adDescription,
            posterName,
            adLocation,
            workType,
            dailyWage: adType === 'daily' ? dailyWage : null,
            adType,
            date
        };
        // Form verilerini sunucuya gönder
        fetch('/api/post-ad', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ağ hatası: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showFormMessage('İlan başarıyla eklendi!', 'success');
                adForm.reset(); // Formu temizle
            } else {
                showFormMessage('İlan eklenirken bir hata oluştu: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            showFormMessage('Bir hata oluştu: ' + error.message, 'danger');
        });
    });

    // Tip seçimini dinle, günlük ücret alanını güncelle
    document.querySelectorAll('input[name="adType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            dailyWageField.style.display = this.value === 'daily' ? 'block' : 'none';
        });
    });
});

// Tek seferlik form mesajı gösterme fonksiyonu
function showFormMessage(message, type) {
    const fm = document.getElementById('formMessage');
    fm.textContent = message;
    fm.className = `alert alert-${type}`;
    fm.style.display = 'block';
    setTimeout(() => fm.style.display = 'none', 3000);
}

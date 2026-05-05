const stories = [
    {
      name: 'Ayşe Yılmaz',
      age: 28,
      story: 'İş ararken bu platform sayesinde bir haftada işe girdim!'
    },
    {
      name: 'Mehmet Kaya',
      age: 35,
      story: 'Kendi inşaat firmama günlük işçi bulmak artık çok kolay.'
    },
    {
      name: 'Zeynep Demir',
      age: 22,
      story: 'Yeni mezun olmama rağmen kısa sürede başvuru aldım.'
    }
  ];
  
  let index = 0;
  const storyCard = document.getElementById('story-card');
  
  function showStory() {
    if (!storyCard) return; // Only run if story-card exists
    
    const { name, age, story } = stories[index];
    storyCard.innerHTML = `
      <h3>${name}, ${age} yaşında</h3>
      <p>"${story}"</p>
    `;
    index = (index + 1) % stories.length;
  }
  
  if (storyCard) {
    showStory();
    setInterval(showStory, 5000);
  }

  // Local Storage functions for job listings
  function saveJobListing(listing) {
    const listings = getJobListings();
    listings.push(listing);
    localStorage.setItem('jobListings', JSON.stringify(listings));
  }
  
  function getJobListings() {
    const listings = localStorage.getItem('jobListings');
    return listings ? JSON.parse(listings) : [];
  }
  
  // Handle job submission form
  document.addEventListener('DOMContentLoaded', function() {
    const jobForm = document.getElementById('job-form');
    if (jobForm) {
      jobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newListing = {
          firstName: document.getElementById('firstName').value,
          lastName: document.getElementById('lastName').value,
          age: document.getElementById('age').value,
          role: document.querySelector('input[name="role"]:checked').value,
          title: document.getElementById('title').value,
          description: document.getElementById('description').value,
          city: document.getElementById('city').value,
          isDailyWage: document.getElementById('isDailyWage').checked,
          createdAt: new Date().toISOString()
        };
        
        saveJobListing(newListing);
        alert('İlanınız başarıyla oluşturuldu!');
        jobForm.reset();
        window.location.href = 'ilanlar.html';
      });
    }
    
    // Display job listings with direct message button
    const listingsContainer = document.getElementById('listings-container');
    if (listingsContainer) {
      const listings = getJobListings();
      
      if (listings.length === 0) {
        listingsContainer.innerHTML = '<div class="alert alert-info">Henüz ilan bulunmamaktadır.</div>';
      } else {
        let html = '';
        listings.forEach((listing, index) => {
          html += `
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="job-card position-relative">
                <button class="btn btn-sm btn-primary dm-btn" onclick="sendDirectMessage(${index})">
                  <i class="fas fa-comment-alt"></i> Mesaj Gönder
                </button>
                <span class="job-type ${listing.role === 'employer' ? 'employer' : 'job-seeker'}">
                  ${listing.role === 'employer' ? 'İşveren' : 'İş Arayan'}
                </span>
                ${listing.isDailyWage ? '<span class="daily-wage">Yevmiyeli</span>' : ''}
                <h5 class="mt-2">${listing.title}</h5>
                <p class="mb-2">${listing.description}</p>
                <p class="mb-1"><strong>Şehir:</strong> ${listing.city}</p>
                <hr>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-muted">İlan Sahibi: ${listing.firstName} ${listing.lastName}, ${listing.age} yaş</small>
                  <small class="text-muted">${new Date(listing.createdAt).toLocaleDateString('tr-TR')}</small>
                </div>
              </div>
            </div>
          `;
        });
        listingsContainer.innerHTML = html;
      }
    }
    
    // Direct messaging function
    function sendDirectMessage(listingIndex) {
      const listings = getJobListings();
      const listing = listings[listingIndex];
      
      if (!listing) return;
      
      // Mesaj bilgilerini localStorage'a kaydedelim
      const newMessage = {
        recipient: `${listing.firstName} ${listing.lastName}`,
        recipientId: `user_${Math.floor(Math.random() * 1000)}`,
        conversation: [
          {
            sender: 'you',
            text: `Merhaba, "${listing.title}" başlıklı ilanınızla ilgileniyorum. Daha fazla bilgi alabilir miyim?`,
            timestamp: new Date().toISOString()
          }
        ]
      };
      
      // Mevcut mesajları getir veya yeni bir dizi oluştur
      const messages = JSON.parse(localStorage.getItem('messages')) || [];
      
      // Eğer bu alıcıyla zaten bir konuşma varsa güncelle, yoksa yenisini ekle
      const existingConvIndex = messages.findIndex(m => m.recipientId === newMessage.recipientId);
      
      if (existingConvIndex >= 0) {
        messages[existingConvIndex].conversation.push(newMessage.conversation[0]);
      } else {
        messages.push(newMessage);
      }
      
      // Mesajları kaydet
      localStorage.setItem('messages', JSON.stringify(messages));
      
      // Mesaj sayfasına yönlendir
      alert('Mesajınız gönderildi! Mesajlar sayfasında görüntüleyebilirsiniz.');
      window.location.href = 'mesajlar.html';
    }
    
    // Handle contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Mesajınız alındı! En kısa sürede size dönüş yapılacaktır.');
        contactForm.reset();
      });
    }
    
    // Updated message display
    const messagesContainer = document.getElementById('messages-container');
    const messageDetails = document.getElementById('message-details');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');

    if (messagesContainer) {
      // Kaydedilmiş mesajları ve örnek mesajları birleştir
      let savedMessages = JSON.parse(localStorage.getItem('messages')) || [];
      
      // Örnek mesajları ekle (eğer kayıtlı mesaj yoksa)
      if (savedMessages.length === 0) {
        savedMessages = [
          {
            recipient: 'Ahmet Yılmaz',
            recipientId: 'user_123',
            conversation: [
              {
                sender: 'Ahmet Yılmaz',
                text: 'Merhaba, ilanınızla ilgileniyorum. Daha fazla bilgi alabilir miyim?',
                timestamp: '2023-06-15T10:30:00'
              },
              {
                sender: 'you',
                text: 'Merhaba Ahmet Bey, hangi detayları öğrenmek istersiniz?',
                timestamp: '2023-06-15T10:45:00'
              },
              {
                sender: 'Ahmet Yılmaz',
                text: 'Çalışma saatleri ve maaş hakkında bilgi verebilir misiniz?',
                timestamp: '2023-06-15T11:00:00'
              }
            ]
          },
          {
            recipient: 'Fatma Demir',
            recipientId: 'user_456',
            conversation: [
              {
                sender: 'Fatma Demir',
                text: 'İş başvurunuzu inceledik. Sizinle görüşmek istiyoruz.',
                timestamp: '2023-06-14T15:45:00'
              }
            ]
          },
          {
            recipient: 'Mehmet Kaya',
            recipientId: 'user_789',
            conversation: [
              {
                sender: 'Mehmet Kaya',
                text: 'Yevmiyeli iş için sizi değerlendirmek istiyoruz. Uygun olduğunuz bir tarih var mı?',
                timestamp: '2023-06-13T09:15:00'
              },
              {
                sender: 'you',
                text: 'Hafta içi her gün saat 10:00’da müsaitim.',
                timestamp: '2023-06-13T09:30:00' 
              }
            ]
          }
        ];
        localStorage.setItem('messages', JSON.stringify(savedMessages));
      }
      // Mesajları görüntüle
      let html = '';
      savedMessages.forEach((message, index) => {
        html += `
          <div class="message-item" data-index="${index}">
            <strong>${message.recipient}</strong>
            <button class="btn btn-sm btn-secondary view-conversation">Görüşmeyi Görüntüle</button>
          </div>
        `;
      });
      messagesContainer.innerHTML = html;
      // Mesajlara tıklama olayını ekle
      const messageItems = document.querySelectorAll('.message-item');
      messageItems.forEach(item => {
        item.addEventListener('click', function() {
          const index = this.getAttribute('data-index');
          const conversation = savedMessages[index].conversation;
          let conversationHtml = '';
          conversation.forEach(msg => {
            conversationHtml += `
              <div class="message">
                <strong>${msg.sender}:</strong>
                <p>${msg.text}</p>
                <small>${new Date(msg.timestamp).toLocaleString('tr-TR')}</small>
              </div>
            `;
          });
          messageDetails.innerHTML = conversationHtml;
          messageInput.value = '';
          sendButton.setAttribute('data-index', index);
        });
      });
      // Mesaj gönderme butonuna tıklama olayını ekle
      sendButton.addEventListener('click', function() {
        const index = this.getAttribute('data-index');
        const newMessageText = messageInput.value.trim();
        if (newMessageText === '') {
          alert('Lütfen bir mesaj yazın.');
          return;
        }
        const newMessage = {
          sender: 'you',
          text: newMessageText,
          timestamp: new Date().toISOString()
        };
        savedMessages[index].conversation.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(savedMessages));
        messageInput.value = '';
        // Görüşmeyi tekrar yükle
        const conversation = savedMessages[index].conversation;
        let conversationHtml = '';
        conversation.forEach(msg => {
          conversationHtml += `
            <div class="message">
              <strong>${msg.sender}:</strong>
              <p>${msg.text}</p>
              <small>${new Date(msg.timestamp).toLocaleString('tr-TR')}</small>
            </div>
          `;
        });
        messageDetails.innerHTML = conversationHtml;
      });
    }
    // Handle job search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchQuery = document.getElementById('search-query').value.toLowerCase();
        const listings = getJobListings().filter(listing => 
          listing.title.toLowerCase().includes(searchQuery) ||
          listing.description.toLowerCase().includes(searchQuery) ||
          listing.city.toLowerCase().includes(searchQuery)
        );
        
        let html = '';
        if (listings.length === 0) {
          html = '<div class="alert alert-info">Aradığınız kriterlere uygun ilan bulunamadı.</div>';
        } else {
          listings.forEach(listing => {
            html += `
              <div class="col-md-6 col-lg-4 mb-4">
                <div class="job-card">
                  <h5>${listing.title}</h5>
                  <p>${listing.description}</p>
                  <p><strong>Şehir:</strong> ${listing.city}</p>
                  <p><strong>İlan Sahibi:</strong> ${listing.firstName} ${listing.lastName}, ${listing.age} yaş</p>
                </div>
              </div>
            `;
          });
        }
        document.getElementById('search-results').innerHTML = html;
      });
    }
    // Handle job seeker registration form
    const seekerForm = document.getElementById('seeker-form');
    if (seekerForm) {
      seekerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newSeeker = {
          firstName: document.getElementById('seeker-firstName').value,
          lastName: document.getElementById('seeker-lastName').value,
          age: document.getElementById('seeker-age').value,
          city: document.getElementById('seeker-city').value,
          skills: document.getElementById('seeker-skills').value.split(',').map(skill => skill.trim()),
          createdAt: new Date().toISOString()
        };
        
        const seekers = JSON.parse(localStorage.getItem('jobSeekers')) || [];
        seekers.push(newSeeker);
        localStorage.setItem('jobSeekers', JSON.stringify(seekers));
        
        alert('İş arayan kaydınız başarıyla oluşturuldu!');
        seekerForm.reset();
      });
    }
    // Display job seekers
    const seekersContainer = document.getElementById('seekers-container');
    if (seekersContainer) {
      const seekers = JSON.parse(localStorage.getItem('jobSeekers')) || [];
      
      if (seekers.length === 0) {
        seekersContainer.innerHTML = '<div class="alert alert-info">Henüz kayıtlı iş arayan bulunmamaktadır.</div>';
      } else {
        let html = '';
        seekers.forEach(seeker => {
          html += `
            <div class="col-md-6 col-lg-4 mb-4">
              <div class="job-card">
                <h5>${seeker.firstName} ${seeker.lastName}, ${seeker.age} yaş</h5>
                <p><strong>Beceriler:</strong></p>
                <ul>
                  ${seeker.skills.map(skill => `<li>${skill}</li>`).join('')}
                </ul>
                <p><strong>Şehir:</strong> ${seeker.city}</p>
                <button class="btn btn-sm btn-primary contact-seeker">İletişime Geç</button>
              </div>
            </div>
          `;
        });
        seekersContainer.innerHTML = html;
      }
    }
    
    // Notifications system
    function showNotification(message, type = 'info') {
      const notificationsContainer = document.getElementById('notifications');
      if (!notificationsContainer) return;
      
      const notification = document.createElement('div');
      notification.className = `alert alert-${type} alert-dismissible fade show`;
      notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Kapat"></button>
      `;
      
      notificationsContainer.appendChild(notification);
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    }
    
    // Auto populate example data if storage is empty
    if (localStorage.getItem('jobListings') === null) {
      const exampleListings = [
        {
          firstName: 'Ahmet',
          lastName: 'Yıldırım',
          age: 35,
          role: 'employer',
          title: 'İnşaat Ustası Aranıyor',
          description: 'Başiskele bölgesinde devam eden inşaat projemiz için deneyimli ustalar aranmaktadır. Günlük ödeme yapılacaktır.',
          city: 'Kocaeli',
          isDailyWage: true,
          createdAt: new Date().toISOString()
        },
        {
          firstName: 'Ayşe',
          lastName: 'Demir',
          age: 42,
          role: 'employer',
          title: 'Kafe İçin Servis Elemanı',
          description: 'Başiskele sahilindeki kafemiz için tam zamanlı ve part-time çalışacak servis elemanları arıyoruz.',
          city: 'Kocaeli',
          isDailyWage: false,
          createdAt: new Date().toISOString()
        },
        {
          firstName: 'Mehmet',
          lastName: 'Kaya',
          age: 26,
          role: 'jobSeeker',
          title: 'Elektrik Teknisyeni İş Arıyor',
          description: '5 yıllık tecrübeye sahibim. Elektrik tesisatı, arıza tespiti ve onarımı konularında uzmanım.',
          city: 'Kocaeli',
          isDailyWage: false,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('jobListings', JSON.stringify(exampleListings));
    }
  });

  // Additional utility functions
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

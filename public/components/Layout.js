import { useState, useContext } from 'react';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';
import { NotificationContext } from '@/context/NotificationContext';
import notificationStyles from '@/styles/GlobalNotifications.module.css';

// ... (sampleNotifications verisi burada kalabilir)

const Layout = ({ children }) => {
  // ... (mevcut state'ler burada kalabilir)
  const { notifications, removeNotification } = useContext(NotificationContext);

  const [sampleNotifications, setSampleNotifications] = useState([
    { id: 1, message: 'Ahmet Yılmaz, "İnşaat Ustası" ilanınıza başvurdu.', time: '10 dakika önce', read: false },
    { id: 2, message: 'Başvurunuz "Kafe Elemanı" pozisyonu için inceleniyor.', time: '1 saat önce', read: false },
    { id: 3, message: 'Yeni bir mesajınız var: Fatma Demir', time: '3 saat önce', read: true },
    { id: 4, message: 'Kaydettiğiniz arama için yeni bir ilan bulundu: "Elektrik Teknisyeni"', time: 'dün', read: true },
  ]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const unreadCount = sampleNotifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <>
      <div className={notificationStyles.container}>
        {notifications.map(n => (
          <div key={n.id} className={`${notificationStyles.notification} ${notificationStyles[n.type]}`}>
            {n.message}
            <button onClick={() => removeNotification(n.id)} className={notificationStyles.closeButton}>&times;</button>
          </div>
        ))}
      </div>

      <Header onNotificationClick={handleNotificationClick} unreadCount={unreadCount} />
      <NotificationsPanel 
        notifications={sampleNotifications} 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
      <main>{children}</main>
    </>
  );
};

export default Layout;

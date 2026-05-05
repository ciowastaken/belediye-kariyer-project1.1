import { useContext } from 'react';
import { NotificationContext } from '@/context/NotificationContext';
import styles from '@/styles/GlobalNotifications.module.css';

const GlobalNotificationWrapper = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {notifications.map(n => (
        <div key={n.id} className={`${styles.notification} ${styles[n.type] || 'info'}`}>
          {n.message}
          <button onClick={() => removeNotification(n.id)} className={styles.closeButton}>&times;</button>
        </div>
      ))}
    </div>
  );
};

export default GlobalNotificationWrapper;

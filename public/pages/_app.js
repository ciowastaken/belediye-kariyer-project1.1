import '@/styles/globals.css'
import { NotificationProvider } from '@/context/NotificationContext'
import GlobalNotificationWrapper from '@/components/GlobalNotificationWrapper'

export default function App({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <GlobalNotificationWrapper />
      <Component {...pageProps} />
    </NotificationProvider>
  )
}

import Head from 'next/head';
import Layout from '@/components/Layout';
import styles from '@/styles/Basvurularim.module.css';

const sampleApplications = [
  { id: 1, title: 'Kafe Elemanı', company: 'Sahil Kafe', status: 'İnceleniyor', date: '1 gün önce' },
  { id: 2, title: 'İnşaat Ustası', company: 'Yıldırım İnşaat', status: 'Mülakat Daveti', date: '3 gün önce' },
  { id: 3, title: 'Elektrik Teknisyeni', company: 'Kent Elektrik', status: 'Başvuru Alındı', date: '1 hafta önce' },
  { id: 4, title: 'Ofis Asistanı', company: 'Belediye Başkanlığı', status: 'Reddedildi', date: '2 hafta önce' },
];

export default function BasvurularimPage() {
  const getStatusClass = (status) => {
    switch (status) {
      case 'İnceleniyor': return styles.statusReview;
      case 'Mülakat Daveti': return styles.statusInterview;
      case 'Reddedildi': return styles.statusRejected;
      default: return styles.statusReceived;
    }
  };

  return (
    <Layout>
      <Head>
        <title>Başvurularım - Belediye Kariyer</title>
      </Head>
      <div className={styles.container}>
        <h1 className={styles.title}>Başvurularım</h1>
        <p className={styles.subtitle}>Yaptığınız iş başvurularının durumunu buradan takip edebilirsiniz.</p>
        <div className={styles.applicationList}>
          {sampleApplications.map(app => (
            <div key={app.id} className={styles.applicationCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.jobTitle}>{app.title}</h2>
                <span className={`${styles.status} ${getStatusClass(app.status)}`}>{app.status}</span>
              </div>
              <p className={styles.companyName}>{app.company}</p>
              <p className={styles.applicationDate}>Başvuru Tarihi: {app.date}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={`${styles.button} ${language === 'ru' ? styles.active : ''}`}
        onClick={() => setLanguage('ru')}
      >
        RU
      </button>
      <div className={styles.divider} />
      <button
        type="button"
        className={`${styles.button} ${language === 'en' ? styles.active : ''}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;

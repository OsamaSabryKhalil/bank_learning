import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CurriculumPage from './pages/CurriculumPage';
import LessonPage from './pages/LessonPage';
import GlossaryPage from './pages/GlossaryPage';
import SimulatorsPage from './pages/SimulatorsPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import OfflineNotice from './components/OfflineNotice';
import { useSettings } from './stores/settings';

export default function App() {
  const lang = useSettings((s) => s.lang);
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const html = document.documentElement;
      const dark = theme === 'system' ? mq.matches : theme === 'dark';
      html.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    if (theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, lang]);

  return (
    <>
      <OfflineNotice />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/simulators" element={<SimulatorsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </>
  );
}

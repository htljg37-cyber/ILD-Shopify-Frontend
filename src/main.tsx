import { createRoot } from 'react-dom/client';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import App from './app/App.tsx';
import './styles/index.css';

new Lenis({
  autoRaf: true,
  lerp: 0.12,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  syncTouch: false,
  anchors: true,
  stopInertiaOnNavigate: true,
  respectReducedMotion: true,
});

createRoot(document.getElementById('root')!).render(<App />);
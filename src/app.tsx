import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TabBar } from './components/ui/tab-bar';
import { SearchTab } from './components/search-tab';
import { NowPlayingTab } from './components/now-playing-tab';
import './styles/global.css';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  authorName?: string;
}

function App() {
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVideoSelect = (video: VideoInfo) => {
    setCurrentVideo(video);
  };

  return (
    <BrowserRouter>
      <div className={`app-container ${isLandscape ? 'landscape-mode' : 'portrait-mode'}`}>
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={<SearchTab onVideoSelect={handleVideoSelect} />} 
            />
            <Route 
              path="/playing" 
              element={
                <NowPlayingTab 
                  video={currentVideo} 
                  onVideoSelect={handleVideoSelect}
                />
              } 
            />
          </Routes>
        </main>

        <TabBar />
      </div>
    </BrowserRouter>
  );
}

export default App;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
}

interface SearchTabProps {
  onVideoSelect: (video: VideoInfo) => void;
}

const STORAGE_KEY = 'watched_videos';

async function getVideoInfo(videoId: string): Promise<{ title: string; thumbnail: string }> {
  try {
    const res = await fetch(`/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await res.json();
    return {
      title: data.title || 'Unknown',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

async function searchYouTube(query: string): Promise<VideoInfo[]> {
  const response = await fetch(`/ytproxy/results?search_query=${encodeURIComponent(query)}`);
  const html = await response.text();
  
  const pattern1 = html.match(/"videoId":"[a-zA-Z0-9_-]{11}/g) || [];
  const pattern2 = html.match(/watch\?v=[a-zA-Z0-9_-]{11}/g) || [];
  
  const videoIds = [...new Set([...pattern1, ...pattern2])]
    .map(s => s.replace('"videoId":"', '').replace('watch?v=', ''))
    .slice(0, 10);

  const videos: VideoInfo[] = await Promise.all(
    videoIds.map(async (videoId) => {
      const info = await getVideoInfo(videoId);
      return { videoId, ...info };
    })
  );
  
  return videos;
}

async function getRecommended(): Promise<VideoInfo[]> {
  const watched = getWatchedVideos();
  
  if (watched.length > 0) {
    const lastWatched = watched[0];
    const related = await searchYouTube(lastWatched.title.split(' ').slice(0, 2).join(' '));
    if (related.length > 0) return related;
  }
  
  return searchYouTube('trending');
}

function getWatchedVideos(): VideoInfo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWatchedVideo(video: VideoInfo) {
  const watched = getWatchedVideos();
  const filtered = watched.filter(v => v.videoId !== video.videoId);
  const updated = [video, ...filtered].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function SearchTab({ onVideoSelect }: SearchTabProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<VideoInfo[]>([]);
  const [recommended, setRecommended] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadRecommended();
    }
  }, []);

  const loadRecommended = async () => {
    setLoading(true);
    setError('');
    try {
      const videos = await getRecommended();
      setRecommended(videos);
    } catch (e) {
      console.error(e);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setError('');
    
    try {
      const videos = await searchYouTube(input);
      setResults(videos);
      if (videos.length === 0) {
        setError('No videos found. Try a different keyword.');
      }
    } catch (e) {
      console.error('Search failed:', e);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: VideoInfo) => {
    saveWatchedVideo(video);
    onVideoSelect(video);
    navigate('/playing');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-sm)',
        background: '#121212',
        padding: 'var(--spacing-sm)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <i className="ph ph-magnifying-glass" style={{ color: '#AAAAAA', fontSize: '28px', alignSelf: 'center' }}></i>
        <input
          type="text"
          placeholder="Search..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ 
            flex: 1, 
            background: 'transparent', 
            padding: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-md)',
          }}
        />
      </div>

      {error && (
        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-md)', color: '#FF0000' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {(hasSearched ? results : recommended).map((video) => (
          <div 
            key={video.videoId}
            onClick={() => handleVideoClick(video)}
            style={{ 
              display: 'flex',
              gap: 'var(--spacing-sm)',
              cursor: 'pointer',
              padding: 'var(--spacing-xs)',
            }}
          >
            <img 
              src={video.thumbnail} 
              alt={video.title}
              style={{ 
                width: '168px',
                height: '94px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0,
              }} 
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="video-title">{video.title}</h3>
              <p className="channel-name">YouTube</p>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xs)' }}>
              <div style={{ width: '168px', height: '94px', background: '#303030', borderRadius: '8px', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                <div style={{ height: '20px', width: '100%', background: '#303030', borderRadius: '4px' }} />
                <div style={{ height: '16px', width: '60%', background: '#303030', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

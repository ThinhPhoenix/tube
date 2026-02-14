import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import YouTube from 'react-youtube';
import { useHaptics } from 'waheim-haptics';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  authorName?: string;
}

interface SearchTabProps {
  onVideoSelect: (video: VideoInfo) => void;
}

const STORAGE_KEY = 'watched_videos';

async function getVideoInfo(videoId: string): Promise<{ title: string; thumbnail: string; authorName?: string }> {
  try {
    const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      title: data.title || 'Unknown',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      authorName: data.author_name,
    };
  } catch {
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

async function searchYouTube(query: string): Promise<VideoInfo[]> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
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
  const [searchParams, setSearchParams] = useSearchParams();
  const triggerHaptics = useHaptics();
  const [input, setInput] = useState('');
  const [results, setResults] = useState<VideoInfo[]>([]);
  const [recommended, setRecommended] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const navigate = useNavigate();
  const isInitialLoad = useRef(true);
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setInput(query);
      performSearch(query);
      document.title = query;
    } else {
      document.title = 'Discover';
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        loadRecommended();
      }
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

  const performSearch = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    setError('');
    
    try {
      const videos = await searchYouTube(query);
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

  const handleSearch = async () => {
    if (!input.trim()) return;
    setSearchParams({ q: input });
    document.title = input;
    await performSearch(input);
  };

  const handleVideoClick = (video: VideoInfo) => {
    triggerHaptics();
    saveWatchedVideo(video);
    setCurrentVideo(video);
    onVideoSelect(video);
    if (!isLandscape) {
      navigate(`/playing?id=${video.videoId}`);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: isLandscape ? 'row' : 'column', 
      gap: 'var(--spacing-md)',
      height: '100%',
    }}>
      <div style={{ 
        flex: isLandscape ? '1' : 'auto',
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-md)',
        overflowY: isLandscape ? 'auto' : 'visible',
      }}>
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

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isLandscape ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
          gap: 'var(--spacing-sm)',
        }}>
          {(hasSearched ? results : recommended).map((video) => (
            <div 
              key={video.videoId}
              onClick={() => handleVideoClick(video)}
              style={{ 
                display: 'flex',
                flexDirection: isLandscape ? 'column' : 'row',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
                padding: 'var(--spacing-xs)',
              }}
            >
              <img 
                src={video.thumbnail} 
                alt={video.title}
                style={{ 
                  width: isLandscape ? '100%' : '168px',
                  height: isLandscape ? 'auto' : '94px',
                  aspectRatio: '16/9',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="video-title">{video.title}</h3>
                <p className="channel-name">{video.authorName}</p>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isLandscape ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
            gap: 'var(--spacing-sm)',
          }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                flexDirection: isLandscape ? 'column' : 'row',
                gap: 'var(--spacing-sm)', 
                padding: 'var(--spacing-xs)',
              }}>
                <div style={{ 
                  width: isLandscape ? '100%' : '168px', 
                  height: isLandscape ? 'auto' : '94px',
                  aspectRatio: '16/9',
                  background: '#303030', 
                  borderRadius: '8px', 
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  <div style={{ height: '20px', width: '100%', background: '#303030', borderRadius: '4px' }} />
                  <div style={{ height: '16px', width: '60%', background: '#303030', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLandscape && currentVideo && (
        <div style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #303030',
          paddingLeft: 'var(--spacing-md)',
        }}>
          <div style={{ 
            width: '100%',
            aspectRatio: '16/9',
            background: '#000',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}>
            <YouTube
              videoId={currentVideo.videoId}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  vq: 'hd1080',
                },
              }}
              style={{ aspectRatio: '16/9' }}
            />
          </div>
          <div style={{ padding: 'var(--spacing-md) 0' }}>
            <h3 className="video-title">{currentVideo.title}</h3>
            <p className="channel-name">{currentVideo.authorName}</p>
          </div>
          <button
            onClick={() => {
              triggerHaptics();
              navigate(`/playing?id=${currentVideo.videoId}`);
            }}
            style={{
              background: '#FFFFFF',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-md)',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-xs)',
            }}
          >
            <i className="ph ph-monitor-play" style={{ fontSize: '20px' }}></i>
            View Full Player
          </button>
        </div>
      )}
    </div>
  );
}

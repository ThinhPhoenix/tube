import { useState, useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useHaptics } from 'waheim-haptics';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  authorName?: string;
}

interface NowPlayingTabProps {
  video: VideoInfo | null;
  onVideoSelect: (video: VideoInfo) => void;
}



async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  try {
    const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      videoId,
      title: data.title || 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      authorName: data.author_name,
    };
  } catch {
    return {
      videoId,
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

async function fetchRelatedVideos(videoId: string, page: number = 0): Promise<VideoInfo[]> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
    const html = await response.text();
    
    const pattern1 = html.match(/"videoId":"[a-zA-Z0-9_-]{11}/g) || [];
    const pattern2 = html.match(/watch\?v=[a-zA-Z0-9_-]{11}/g) || [];
    
    const videoIds = [...new Set([...pattern1, ...pattern2])]
      .map(s => s.replace('"videoId":"', '').replace('watch?v=', ''))
      .filter(id => id !== videoId);

    const start = page * 6;
    const slicedIds = videoIds.slice(start, start + 6);

    if (slicedIds.length === 0) return [];

    const videos: VideoInfo[] = await Promise.all(
      slicedIds.map(async (vid) => {
        try {
          const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`;
          const res = await fetch(oembedUrl);
          const videoData = await res.json();
          return {
            videoId: vid,
            title: videoData.title || 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
            authorName: videoData.author_name,
          };
        } catch {
          return {
            videoId: vid,
            title: 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          };
        }
      })
    );
    
    return videos;
  } catch {
    return [];
  }
}

export function NowPlayingTab({ video, onVideoSelect }: NowPlayingTabProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const triggerHaptics = useHaptics();
  const [urlVideo, setUrlVideo] = useState<VideoInfo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoInfo[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const observerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<VideoInfo | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const autoPlayTimerRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);

  const videoId = searchParams.get('id');
  
  // Derive current video: use urlVideo only if it matches the URL param, otherwise use prop
  const currentVideo = (urlVideo && videoId === urlVideo.videoId) ? urlVideo : video;

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearAutoPlayTimer = () => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  };

  const handleUserInteraction = () => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      if (playerRef.current) {
        playerRef.current.unMute();
        playerRef.current.playVideo();
      }
    }
    clearAutoPlayTimer();
  };

  const handleRelatedVideoClick = (relatedVideo: VideoInfo) => {
    triggerHaptics();
    clearAutoPlayTimer();
    onVideoSelect(relatedVideo);
    navigate(`/playing?id=${relatedVideo.videoId}`);
  };

  const handleVideoEnd = () => {
    userInteractedRef.current = false;
    clearAutoPlayTimer();
    
    autoPlayTimerRef.current = window.setTimeout(() => {
      if (!userInteractedRef.current && relatedVideos.length > 0) {
        const nextVideo = relatedVideos[0];
        handleRelatedVideoClick(nextVideo);
      }
    }, 5000);
  };

  useEffect(() => {
    if (videoId) {
      getVideoInfo(videoId).then(videoInfo => {
        setUrlVideo(videoInfo);
        onVideoSelect(videoInfo);
      });
    }
  }, [videoId]);

  useEffect(() => {
    videoRef.current = currentVideo;
    if (currentVideo) {
      document.title = currentVideo.title;
    }
    clearAutoPlayTimer();
    userInteractedRef.current = false;
    
    return () => {
      clearAutoPlayTimer();
    };
  });

  useEffect(() => {
    const currentVideoData = videoRef.current;
    if (currentVideoData) {
      const loadVideos = async () => {
        setLoading(true);
        const videos = await fetchRelatedVideos(currentVideoData.videoId, 0);
        setRelatedVideos(videos);
        setHasMore(videos.length >= 6);
        setPage(0);
        setLoading(false);
      };
      loadVideos();
    }
  }, [currentVideo?.videoId]);

  const loadMore = useCallback(async () => {
    const currentVideoData = videoRef.current;
    if (!currentVideoData || loading || !hasMore) return;
    
    setLoading(true);
    const nextPage = page + 1;
    const videos = await fetchRelatedVideos(currentVideoData.videoId, nextPage);
    
    if (videos.length > 0) {
      setRelatedVideos(prev => [...prev, ...videos]);
      setPage(nextPage);
      setHasMore(videos.length >= 6);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  }, [page, loading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  if (!currentVideo) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: '#AAAAAA',
      }}>
        <i className="ph ph-monitor-play" style={{ fontSize: '80px', marginBottom: 'var(--spacing-md)' }}></i>
        <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-sm)' }}>
          No video selected
        </p>
        <p style={{ fontSize: 'var(--font-size-md)' }}>
          Search for a video to start watching
        </p>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: isLandscape ? 'row' : 'column', 
        margin: 0, 
        padding: 0,
        position: 'relative',
      }}
      onTouchStart={handleUserInteraction}
      onClick={handleUserInteraction}
      onScroll={handleUserInteraction}
    >
      {isLandscape && (
        <button
          onClick={() => {
            triggerHaptics();
            navigate('/');
          }}
          style={{
            position: 'absolute',
            top: 'var(--spacing-sm)',
            left: 'var(--spacing-sm)',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <i className="ph ph-magnifying-glass" style={{ fontSize: '24px' }}></i>
        </button>
      )}
      <div style={{ 
        flexShrink: 0, 
        width: isLandscape ? '60%' : '100vw', 
        marginLeft: isLandscape ? 0 : 'calc(-1 * var(--spacing-md))', 
        marginRight: isLandscape ? 0 : 'calc(-1 * var(--spacing-md))',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ 
          width: '100%',
          paddingBottom: '56.25%',
          position: 'relative',
          background: '#000',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <YouTube
              videoId={currentVideo.videoId}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  mute: 1,
                  vq: 'hd1080',
                },
              }}
              style={{ width: '100%', height: '100%' }}
              onReady={(event: { target: YouTubePlayer }) => {
                playerRef.current = event.target;
              }}
              onEnd={handleVideoEnd}
            />
          </div>
        </div>
        <div style={{ padding: 'var(--spacing-md)' }}>
          <h3 className="video-title">{currentVideo.title}</h3>
          <p className="channel-name">{currentVideo.authorName}</p>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        paddingLeft: isLandscape ? 'var(--spacing-md)' : 0,
      }}>
        <div>
          {relatedVideos.length > 0 && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isLandscape ? '1fr' : '1fr',
              gridGap: 'var(--spacing-sm)',
            }}>
              {relatedVideos.map((related) => (
                <div 
                  key={related.videoId}
                  onClick={() => handleRelatedVideoClick(related)}
                  style={{ 
                    display: 'flex',
                    flexDirection: isLandscape ? 'column' : 'row',
                    cursor: 'pointer',
                    padding: 'var(--spacing-xs)',
                  }}
                >
                  <img 
                    src={related.thumbnail} 
                    alt={related.title}
                    style={{ 
                      width: isLandscape ? '100%' : '168px',
                      height: isLandscape ? 'auto' : '94px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                      marginRight: isLandscape ? '0' : 'var(--spacing-sm)',
                      marginBottom: isLandscape ? 'var(--spacing-sm)' : '0',
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="video-title">{related.title}</h3>
                    <p className="channel-name">{related.authorName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loading && (
     <div style={{ 
       display: 'grid',
       gridTemplateColumns: isLandscape ? '1fr' : '1fr',
       gridGap: 'var(--spacing-sm)',
     }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  flexDirection: isLandscape ? 'column' : 'row',
                  padding: 'var(--spacing-xs)',
                }}>
                  <div style={{ 
                    width: isLandscape ? '100%' : '168px', 
                    height: isLandscape ? 'auto' : '94px',
                    background: '#303030', 
                    borderRadius: 'var(--radius-sm)', 
                    flexShrink: 0,
                    marginRight: isLandscape ? '0' : 'var(--spacing-sm)',
                    marginBottom: isLandscape ? 'var(--spacing-sm)' : '0',
                  }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ height: '20px', width: '100%', background: '#303030', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ height: '14px', width: '60%', background: '#303030', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div ref={observerRef} style={{ textAlign: 'center', padding: 'var(--spacing-md) 0' }}>
            {!hasMore && relatedVideos.length > 0 && (
              <p style={{ color: '#AAAAAA', fontSize: '14px' }}>No more videos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
}

interface NowPlayingTabProps {
  video: VideoInfo | null;
  onVideoSelect: (video: VideoInfo) => void;
}

async function fetchRelatedVideos(videoId: string, page: number = 0): Promise<VideoInfo[]> {
  try {
    const response = await fetch(`/ytproxy/watch?v=${videoId}`);
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
          const res = await fetch(`/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`);
          const data = await res.json();
          return {
            videoId: vid,
            title: data.title || 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
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
  const [relatedVideos, setRelatedVideos] = useState<VideoInfo[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<VideoInfo | null>(null);

  useEffect(() => {
    videoRef.current = video;
  });

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (currentVideo) {
      const loadVideos = async () => {
        setLoading(true);
        const videos = await fetchRelatedVideos(currentVideo.videoId, 0);
        setRelatedVideos(videos);
        setHasMore(videos.length >= 6);
        setPage(0);
        setLoading(false);
      };
      loadVideos();
    }
  }, [video?.videoId]);

  const loadMore = useCallback(async () => {
    const currentVideo = videoRef.current;
    if (!currentVideo || loading || !hasMore) return;
    
    setLoading(true);
    const nextPage = page + 1;
    const videos = await fetchRelatedVideos(currentVideo.videoId, nextPage);
    
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

  if (!video) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        gap: 'var(--spacing-md)',
        color: '#AAAAAA',
      }}>
        <i className="ph ph-monitor-play" style={{ fontSize: '80px' }}></i>
        <p style={{ fontSize: 'var(--font-size-lg)' }}>
          No video selected
        </p>
        <p style={{ fontSize: 'var(--font-size-md)' }}>
          Search for a video to start watching
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      <div style={{ flexShrink: 0, width: '100vw', marginLeft: 'calc(-1 * var(--spacing-md))', marginRight: 'calc(-1 * var(--spacing-md))' }}>
        <div style={{ 
          width: '100%',
          aspectRatio: '16/9',
          background: '#000',
        }}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&vq=hd1080`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ aspectRatio: '16/9' }}
          />
        </div>
        <div style={{ padding: 'var(--spacing-md)' }}>
          <h2 className="video-title" style={{ fontSize: 'var(--font-size-md)' }}>{video.title}</h2>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div>
          {relatedVideos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {relatedVideos.map((related) => (
                <div 
                  key={related.videoId}
                  onClick={() => onVideoSelect(related)}
                  style={{ 
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    cursor: 'pointer',
                    padding: 'var(--spacing-xs)',
                  }}
                >
                  <img 
                    src={related.thumbnail} 
                    alt={related.title}
                    style={{ 
                      width: '168px',
                      height: '94px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="video-title" style={{ fontSize: '14px' }}>{related.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {loading && (
     <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xs)' }}>
                  <div style={{ width: '168px', height: '94px', background: '#303030', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                    <div style={{ height: '20px', width: '100%', background: '#303030', borderRadius: '4px' }} />
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

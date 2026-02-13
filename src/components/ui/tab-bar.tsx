import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useHaptics } from 'waheim-haptics';

const tabStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  color: '#AAAAAA',
  fontSize: '12px',
  fontWeight: '500',
  gap: '4px',
  transition: 'color 0.2s',
};

const activeTabStyle: React.CSSProperties = {
  color: '#FFFFFF',
};

export function TabBar() {
  const triggerHaptics = useHaptics();
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLandscape) {
    return null;
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '800px',
      height: 'var(--tabbar-height)',
      background: '#181818',
      borderTop: '1px solid #303030',
      display: 'flex',
      paddingBottom: '8px',
    }}>
      <NavLink
        to="/"
        onClick={() => triggerHaptics()}
        style={({ isActive }) => ({
          ...tabStyle,
          ...(isActive ? activeTabStyle : {}),
        })}
      >
        <i className="ph ph-magnifying-glass" style={{ fontSize: '28px' }}></i>
      </NavLink>
      
      <NavLink
        to="/playing"
        onClick={() => triggerHaptics()}
        style={({ isActive }) => ({
          ...tabStyle,
          ...(isActive ? activeTabStyle : {}),
        })}
      >
        <i className="ph ph-monitor-play" style={{ fontSize: '28px' }}></i>
      </NavLink>
    </nav>
  );
}

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

const sidebarTabStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  color: '#AAAAAA',
  fontSize: '14px',
  fontWeight: '500',
  gap: '8px',
  padding: '20px 0',
  transition: 'color 0.2s, background 0.2s',
  width: '100%',
};

const sidebarActiveTabStyle: React.CSSProperties = {
  color: '#FFFFFF',
  background: 'rgba(255, 255, 255, 0.1)',
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
    return (
      <nav style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '80px',
        background: '#181818',
        borderRight: '1px solid #303030',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: 100,
      }}>
        <NavLink
          to="/"
          onClick={() => triggerHaptics()}
          style={({ isActive }) => ({
            ...sidebarTabStyle,
            ...(isActive ? sidebarActiveTabStyle : {}),
          })}
        >
          <i className="ph ph-magnifying-glass" style={{ fontSize: '32px' }}></i>
          <span style={{ fontSize: '11px' }}>Search</span>
        </NavLink>
        
        <NavLink
          to="/playing"
          onClick={() => triggerHaptics()}
          style={({ isActive }) => ({
            ...sidebarTabStyle,
            ...(isActive ? sidebarActiveTabStyle : {}),
          })}
        >
          <i className="ph ph-monitor-play" style={{ fontSize: '32px' }}></i>
          <span style={{ fontSize: '11px' }}>Playing</span>
        </NavLink>
      </nav>
    );
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
      zIndex: 100,
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

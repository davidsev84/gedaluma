import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, LayoutDashboard, 
  Calendar, History, Tag, LogOut, RotateCw
} from 'lucide-react';
import { ProductCatalogModal } from './ProductCatalogModal';
import { ThemeToggle } from './ThemeToggle';
import { SYSTEM_VERSION } from '../config/version';
import { syncOfflineDataToSupabase, hasPendingOfflineData } from '../lib/syncService';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOffline, setPendingOffline] = useState(false);

  useEffect(() => {
    // Continuous background auto-sync check
    const checkAndAutoSync = async () => {
      const hasData = hasPendingOfflineData();
      setPendingOffline(hasData);
      if (hasData && navigator.onLine && !isSyncing) {
        try {
          const res = await syncOfflineDataToSupabase();
          setPendingOffline(hasPendingOfflineData());
          if (res.totalSynced > 0) {
            console.log(`[Auto-Sync] ${res.totalSynced} registros sincronizados automáticamente con Supabase.`);
          }
        } catch (e) {
          console.warn('[Auto-Sync Error]', e);
        }
      }
    };

    checkAndAutoSync();
    const interval = setInterval(checkAndAutoSync, 8000);
    window.addEventListener('online', checkAndAutoSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkAndAutoSync);
    };
  }, [isSyncing]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncOfflineDataToSupabase();
      const stillHasPending = hasPendingOfflineData();
      setPendingOffline(stillHasPending);

      if (res.totalSynced > 0) {
        alert(`✅ Sincronización exitosa: ${res.totalSynced} registros procesados y subidos a la nube.`);
        window.location.reload();
      } else if (!stillHasPending) {
        alert('🟢 Todos los registros del navegador están al día y sincronizados con Supabase.');
      } else {
        const confirmPurge = window.confirm(
          '⚠️ Se verificó la conexión pero persisten datos pendientes no sincronizables en la memoria del navegador.\n\n¿Deseas purgar la memoria local para desactivar la advertencia en rojo?'
        );
        if (confirmPurge) {
          localStorage.removeItem('gedaluma_offline_inventories');
          localStorage.removeItem('gedaluma_offline_inventory_items');
          localStorage.removeItem('gedaluma_offline_evaluations');
          localStorage.removeItem('gedaluma_offline_logbook');
          localStorage.removeItem('gedaluma_offline_penalties');
          setPendingOffline(false);
          alert('🟢 Memoria local purgada con éxito.');
          window.location.reload();
        }
      }
    } catch (err: any) {
      alert(`⚠️ Error en la sincronización: ${err.message || String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isGhostRole = user.role === 'ghost';

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Panel',
      desc: 'Vista general de islas y métricas',
      icon: LayoutDashboard,
      color: '#009C48'
    },
    {
      path: '/history',
      label: 'Historial',
      desc: 'Registros e informes PDF',
      icon: History,
      color: '#6366f1'
    },
    {
      path: '/logbook',
      label: 'Bitácora',
      desc: 'Novedades y agenda diaria',
      icon: Calendar,
      color: '#8b5cf6'
    }
  ];

  const isCurrentPath = (path: string) => {
    if (path.includes('?mode=ghost')) {
      return location.pathname === '/evaluate' && location.search.includes('mode=ghost');
    }
    if (path === '/evaluate') {
      return location.pathname === '/evaluate' && !location.search.includes('mode=ghost');
    }
    return location.pathname === path;
  };

  return (
    <>
      <ProductCatalogModal 
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
      />

      <nav className="main-navbar" style={{
        background: 'var(--surface-color)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 990,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease'
      }}>
        <div className="container" style={{ padding: '8px 16px', paddingTop: '8px !important' }}>
          <div className="flex justify-between items-center" style={{ gap: '12px' }}>
            
            {/* LOGO & PERFIL DE USUARIO */}
            <Link to="/app" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', minWidth: '180px' }}>
              <img src="/logo.png" alt="Gedaluma" style={{ height: '34px', width: 'auto' }} />
              <div>
                <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#009C48', display: 'block', lineHeight: 1.1 }}>
                  GEDALUMA
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {user.name} ({isAdmin ? 'Administrador' : isGhostRole ? 'Cliente Fantasma' : 'Supervisor'})
                </span>
              </div>
            </Link>

            {/* NAVEGACIÓN DESKTOP & TABLETS LARGAS (> 1080px) */}
            <div className="hidden-mobile flex items-center gap-2">
              {navItems.map(item => {
                const active = isCurrentPath(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="btn hover-lift"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      background: active ? item.color : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-primary)',
                      border: active ? `1px solid ${item.color}` : '1px solid var(--border-color)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* BARRA DE HERRAMIENTAS DERECHA (DESKTOP + MOBILE) */}
            <div className="flex items-center gap-2">
              
              {/* BOTÓN DE SINCRONIZACIÓN AUTO/MANUAL */}
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="btn hover-lift"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: pendingOffline ? '#ef4444' : 'rgba(0, 156, 72, 0.08)',
                  color: pendingOffline ? '#ffffff' : '#009C48',
                  border: `1px solid ${pendingOffline ? '#ef4444' : 'rgba(0, 156, 72, 0.25)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title={pendingOffline ? "Hay registros locales guardados offline. Haz clic para subir a Supabase." : "Base de datos sincronizada en tiempo real"}
              >
                <RotateCw size={15} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                <span className="hidden-mobile">
                  {isSyncing ? 'Sincronizando...' : pendingOffline ? '⚠️ Subir Pendientes' : '🟢 Auto-Sync Cloud'}
                </span>
              </button>

              {/* MODIFICAR COSTOS / CATÁLOGO */}
              <button
                onClick={() => setShowCatalogModal(true)}
                className="btn hidden-mobile"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: 'rgba(0, 156, 72, 0.08)',
                  color: '#009C48',
                  border: '1px solid rgba(0, 156, 72, 0.25)'
                }}
                title="Editar costos de productos"
              >
                <Tag size={15} /> Costos
              </button>

              {/* MODO OSCURO / CLARO */}
              <ThemeToggle />

              {/* CERRAR SESIÓN DESKTOP */}
              <button
                onClick={handleLogout}
                className="btn btn-ghost hidden-mobile"
                style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>

              {/* BOTÓN HAMBURGUESA ICONO LIMPIO PARA MÓVILES Y TABLETS (< 1080px) */}
              <div className="show-mobile flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="btn hover-lift"
                  style={{
                    padding: '8px 10px',
                    background: '#009C48',
                    color: '#ffffff',
                    borderRadius: '10px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,156,72,0.25)'
                  }}
                  title="Navegación principal"
                  aria-label="Abrir menú"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>

            </div>

          </div>
        </div>
      </nav>

      {/* MENÚ HAMBURGUESA DESPLEGABLE MÓVIL Y TABLET */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-color)',
            zIndex: 9999,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            animation: 'fadeIn 0.25s ease forwards'
          }}
        >
          {/* HEADER DEL PANEL DESPLEGABLE */}
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
            <div className="flex justify-between items-center">
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sistema GEDALUMA {SYSTEM_VERSION.version}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                  {user.name}
                </h3>
              </div>
              <span style={{ padding: '4px 10px', background: 'rgba(0, 156, 72, 0.12)', color: '#009C48', fontWeight: 800, borderRadius: '8px', fontSize: '0.75rem' }}>
                {isAdmin ? 'ADMINISTRADOR' : isGhostRole ? 'CLIENTE FANTASMA' : 'SUPERVISOR'}
              </span>
            </div>
          </div>

          {/* LISTADO DE OPCIONES DE NAVEGACIÓN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {navItems.map(item => {
              const active = isCurrentPath(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn hover-lift"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: active ? item.color : 'var(--surface-color)',
                    color: active ? '#ffffff' : 'var(--text-primary)',
                    border: `1.5px solid ${active ? item.color : 'var(--border-color)'}`,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    justifyContent: 'flex-start',
                    width: '100%'
                  }}
                >
                  <div style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,156,72,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} style={{ color: active ? '#ffffff' : item.color }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: active ? 0.9 : 0.7, fontWeight: 500 }}>
                      {item.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ACCIONES EXTRA MÓVIL (CATÁLOGO Y AUTO-SYNC) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleManualSync();
              }}
              className="btn hover-lift"
              style={{
                padding: '12px 16px',
                fontSize: '0.9rem',
                fontWeight: 800,
                borderRadius: '12px',
                background: pendingOffline ? '#ef4444' : 'rgba(2, 132, 199, 0.1)',
                color: pendingOffline ? '#ffffff' : '#0284c7',
                border: `1.5px solid ${pendingOffline ? '#ef4444' : '#0284c7'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'flex-start',
                width: '100%'
              }}
            >
              <RotateCw size={20} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncing ? 'Sincronizando...' : pendingOffline ? '⚠️ Subir Pendientes a Supabase' : '🟢 Sincronizado en Tiempo Real'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCatalogModal(true);
              }}
              className="btn hover-lift"
              style={{
                padding: '12px 16px',
                fontSize: '0.9rem',
                fontWeight: 800,
                borderRadius: '12px',
                background: 'rgba(0, 156, 72, 0.08)',
                color: '#009C48',
                border: '1.5px solid rgba(0, 156, 72, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'flex-start',
                width: '100%'
              }}
            >
              <Tag size={20} />
              <span>🏷️ Modificar Catálogo & Costos</span>
            </button>
          </div>

          {/* BOTÓN CERRAR SESIÓN EN MENÚ MÓVIL */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={handleLogout}
              className="btn btn-danger hover-lift"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={20} /> Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}

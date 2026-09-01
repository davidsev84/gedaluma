import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, LayoutDashboard, FileCheck2, UserCheck, 
  PackagePlus, Calendar, History, Tag, LogOut, RotateCw
} from 'lucide-react';
import { ProductCatalogModal } from './ProductCatalogModal';
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
    setPendingOffline(hasPendingOfflineData());
    const interval = setInterval(() => {
      setPendingOffline(hasPendingOfflineData());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const res = await syncOfflineDataToSupabase();
      setPendingOffline(hasPendingOfflineData());
      if (res.totalSynced > 0) {
        alert(`✅ Sincronización exitosa: ${res.totalSynced} registros enviados a la nube (Inventarios: ${res.inventoriesSynced}, Evaluaciones: ${res.evaluationsSynced}, Bitácora: ${res.logbookSynced}).`);
        window.location.reload();
      } else {
        alert('ℹ️ Todos los datos ya se encuentran sincronizados en la base de datos de Supabase.');
      }
    } catch (err: any) {
      alert(`⚠️ Error al sincronizar con Supabase: ${err.message || String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    ...(isAdmin ? [{
      path: '/dashboard',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      color: '#009C48'
    }] : []),
    {
      path: '/evaluate',
      label: 'Evaluación',
      icon: FileCheck2,
      color: '#009C48'
    },
    {
      path: '/evaluate?mode=ghost',
      label: 'Cliente Fantasma',
      icon: UserCheck,
      color: '#f7b500'
    },
    {
      path: '/inventory/new',
      label: 'Nuevo Inventario',
      icon: PackagePlus,
      color: '#0284c7'
    },
    {
      path: '/logbook',
      label: 'Novedades (Bitácora)',
      icon: Calendar,
      color: '#8b5cf6'
    },
    ...(isAdmin ? [{
      path: '/history',
      label: 'Historial',
      icon: History,
      color: '#6366f1'
    }] : [])
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
        zIndex: 900,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div className="container" style={{ padding: '10px 16px', paddingTop: '10px !important' }}>
          <div className="flex justify-between items-center">
            
            {/* LOGO & TITULO */}
            <Link to="/app" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <img src="/logo.png" alt="Gedaluma" style={{ height: '36px', width: 'auto' }} />
              <div>
                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#009C48', display: 'block', lineHeight: 1.1 }}>
                  GEDALUMA
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {user.name} ({user.role === 'admin' ? 'Administrador' : 'Supervisor'})
                </span>
              </div>
            </Link>

            {/* NAVEGACIÓN DESKTOP (PANTALLAS GRANDES) */}
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

              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                className="btn hover-lift"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: pendingOffline ? '#ef4444' : 'rgba(2, 132, 199, 0.1)',
                  color: pendingOffline ? '#ffffff' : '#0284c7',
                  border: `1px solid ${pendingOffline ? '#ef4444' : '#0284c7'}`
                }}
                title="Sincronizar inventarios y registros guardados localmente con Supabase"
              >
                <RotateCw size={16} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                {isSyncing ? 'Sincronizando...' : pendingOffline ? '⚠️ Sincronizar Pendientes' : 'Sincronizar Cloud'}
              </button>

              <button
                onClick={() => setShowCatalogModal(true)}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: 'rgba(0, 156, 72, 0.1)',
                  color: '#009C48',
                  border: '1px solid #009C48'
                }}
              >
                <Tag size={16} /> Productos
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* BOTÓN MENÚ HAMBURGUESA PARA MÓVILES (< 768px) */}
            <div className="show-mobile flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn hover-lift"
                style={{
                  padding: '8px 14px',
                  background: '#009C48',
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '0.88rem'
                }}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                <span>Menú</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* MENÚ HAMBURGUESA DESPLEGABLE MÓVIL */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: '58px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-color)',
            zIndex: 999,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            animation: 'fadeIn 0.2s ease forwards'
          }}
        >
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase' }}>
              Navegación del Sistema ({SYSTEM_VERSION.version})
            </span>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Usuario: {user.name} ({user.role === 'admin' ? 'Administrador' : 'Supervisor'})
            </p>
          </div>

          {navItems.map(item => {
            const active = isCurrentPath(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="btn"
                style={{
                  padding: '14px 18px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  background: active ? item.color : 'var(--surface-color)',
                  color: active ? '#ffffff' : 'var(--text-primary)',
                  border: `1.5px solid ${active ? item.color : 'var(--border-color)'}`,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'flex-start'
                }}
              >
                <Icon size={22} style={{ color: active ? '#ffffff' : item.color }} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleSyncData();
            }}
            className="btn"
            style={{
              padding: '14px 18px',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: '12px',
              background: pendingOffline ? '#ef4444' : 'rgba(2, 132, 199, 0.12)',
              color: pendingOffline ? '#ffffff' : '#0284c7',
              border: `1.5px solid ${pendingOffline ? '#ef4444' : '#0284c7'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: 'flex-start',
              width: '100%'
            }}
          >
            <RotateCw size={22} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isSyncing ? 'Sincronizando...' : pendingOffline ? '⚠️ Sincronizar Pendientes' : '🔄 Sincronizar Datos a la Nube'}</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setShowCatalogModal(true);
            }}
            className="btn"
            style={{
              padding: '14px 18px',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: '12px',
              background: 'rgba(0, 156, 72, 0.12)',
              color: '#009C48',
              border: '1.5px solid #009C48',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: 'flex-start',
              width: '100%'
            }}
          >
            <Tag size={22} />
            <span>🏷️ Catálogo de Productos (Costos)</span>
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{
                width: '100%',
                padding: '14px',
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

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Sparkles, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { SYSTEM_VERSION } from '../config/version';
import { useAuth } from '../context/AuthContext';

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Forzar siempre Modo Normal (Claro) en la página inicial (Home)
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div style={{ background: '#ffffff', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Encabezado limpio sólo si no hay sesión iniciada (evita menú duplicado) */}
      {!user && (
        <nav style={{ 
          position: 'sticky', top: 0, left: 0, right: 0, 
          zIndex: 50, padding: '12px 20px', background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="Gedaluma Logo" style={{ height: '36px', width: 'auto' }} />
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#009C48', display: 'block', lineHeight: 1.1 }}>
                GEDALUMA
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>
                FRANQUICIADO COCO EXPRESS ®
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary" 
            style={{ padding: '8px 18px', fontSize: '0.88rem', fontWeight: 800, background: '#009C48', borderColor: '#009C48', borderRadius: '8px' }}
          >
            Acceso al Sistema
          </button>
        </nav>
      )}

      {/* Hero Section */}
      <section id="proposito" className="landing-section container fade-in-up" style={{ paddingTop: '32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Logo Oficial Banner Coco Express */}
          <div style={{ 
            marginBottom: '28px', 
            display: 'inline-block',
            padding: '16px 28px',
            background: '#f8fafc',
            borderRadius: '20px',
            border: '1px solid rgba(0, 156, 72, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 156, 72, 0.08)'
          }}>
            <img 
              src="https://i0.wp.com/cocoexpress.com.ec/wp-content/uploads/2023/07/logoCocoExpress.png?fit=1000%2C438&ssl=1" 
              alt="Coco Express Banner Oficial" 
              style={{ maxHeight: '90px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', background: 'rgba(0, 156, 72, 0.1)', 
              color: '#009C48', borderRadius: '30px', fontWeight: 800, marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(0, 156, 72, 0.25)'
            }}>
              <Award size={18} /> Franquiciado Estratégico de Coco Express ®
            </span>
          </div>

          <h1 className="text-3xl" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', lineHeight: 1.15, marginBottom: '20px', fontWeight: 800, color: '#0f172a' }}>
            Transformando la <span style={{ color: '#009C48' }}>Excelencia Operativa</span> en cada detalle.
          </h1>
          
          <p style={{ fontSize: '1.15rem', marginBottom: '32px', lineHeight: 1.6, maxWidth: '760px', margin: '0 auto 32px auto', color: '#475569' }}>
            Nuestra visión es garantizar la estandarización y calidad en todos nuestros puntos de venta, 
            asegurando que el cliente final experimente la promesa de marca de Coco Express en cada atención.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button 
              onClick={() => navigate(user ? '/dashboard' : '/login')} 
              className="btn btn-primary hover-lift" 
              style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 800, background: '#009C48', borderColor: '#009C48' }}
            >
              {user ? 'Ir al Panel de Control' : 'Ingresar al Sistema'} <ArrowRight size={20} />
            </button>
            <a href="#adn" className="btn btn-ghost hover-lift" style={{ padding: '14px 28px', fontSize: '1.05rem', color: '#334155', fontWeight: 700 }}>
              Conoce nuestro ADN
            </a>
          </div>
        </div>
      </section>

      {/* ADN Section (Services/Values) */}
      <section id="adn" className="landing-section container">
        <div className="fade-in-up">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: '#d97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.85rem' }}>Nuestra Identidad</span>
            <h2 className="text-3xl" style={{ marginTop: '8px', marginBottom: '12px', color: '#0f172a', fontWeight: 800 }}>ADN GEDALUMA</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', color: '#475569' }}>
              Nuestro éxito se fundamenta en cuatro pilares de gestión operativa, los cuales son de cumplimiento obligatorio en cada una de nuestras islas.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div className="card hover-lift" style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 156, 72, 0.1)', color: '#009C48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Standard y Calidad</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Monitoreo estricto del Manual Operativo para asegurar la inocuidad y excelencia en cada producto servido.
              </p>
            </div>

            <div className="card hover-lift" style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Control Operativo</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Auditorías aleatorias semanales e inventarios comparativos físico vs. sistema sin margen de descuadre.
              </p>
            </div>

            <div className="card hover-lift" style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(247, 181, 0, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Cliente Fantasma</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Evaluación continua de la experiencia de compra, hospitalidad y técnicas de venta en punto de venta.
              </p>
            </div>

            <div className="card hover-lift" style={{ padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Heart size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Desarrollo Humano</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Capacitación constante y acompañamiento presencial para el desarrollo de competencias de nuestro equipo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compromiso Section */}
      <section id="compromiso" className="landing-section container" style={{ paddingBottom: '80px' }}>
        <div className="card" style={{ padding: '40px', background: 'linear-gradient(135deg, #009C48 0%, #007a38 100%)', color: '#ffffff', borderRadius: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
            Compromiso con la Marca Coco Express ®
          </h2>
          <p style={{ fontSize: '1.1rem', maxWidth: '720px', margin: '0 auto 28px auto', opacity: 0.95, lineHeight: 1.6 }}>
            En GEDALUMA trabajamos cada día para ser el franquiciado modelo, elevando los estándares de la red y garantizando la satisfacción total de nuestros clientes.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <span className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '0.95rem' }}><CheckCircle2 size={18} /> Auditorías Semanales</span>
            <span className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '0.95rem' }}><CheckCircle2 size={18} /> Control de Cadena de Frío</span>
            <span className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '0.95rem' }}><CheckCircle2 size={18} /> Re-entrenamiento en Campo</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '24px 0', background: '#f8fafc' }}>
        <div className="container flex justify-between items-center flex-wrap gap-4" style={{ fontSize: '0.85rem', color: '#64748b' }}>
          <div>
            <strong>GEDALUMA</strong> - Sistema de Gestión Operativa {SYSTEM_VERSION.version}
          </div>
          <div>
            © {new Date().getFullYear()} Coco Express ®. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Sparkles, TrendingUp, Menu, X, Award, CheckCircle2 } from 'lucide-react';
import { SYSTEM_VERSION } from '../config/version';

export function Landing() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav className="glass-panel" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, 
        zIndex: 50, padding: '16px 24px', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo-wide.png" alt="Gedaluma Logo" style={{ height: '45px', width: 'auto' }} />
          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#009C48', letterSpacing: '0.5px' }}>
            COCO EXPRESS ®
          </span>
        </div>
        
        <div className="flex gap-4 items-center hidden-mobile" style={{ paddingRight: '160px' }}>
          <a href="#proposito" className="btn btn-ghost" style={{ border: 'none' }}>Visión</a>
          <a href="#adn" className="btn btn-ghost" style={{ border: 'none' }}>Valores</a>
          <a href="#compromiso" className="btn btn-ghost" style={{ border: 'none' }}>Compromiso</a>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginLeft: '16px', background: '#009C48', borderColor: '#009C48' }}>
            Acceso al Sistema
          </button>
        </div>
        
        {/* Mobile menu toggle */}
        <div className="show-mobile" style={{ marginRight: '54px' }}>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="btn btn-ghost" 
            style={{ padding: '8px' }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay show-mobile">
          <a href="#proposito" className="btn btn-ghost" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.2rem', justifyContent: 'flex-start' }}>Visión</a>
          <a href="#adn" className="btn btn-ghost" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.2rem', justifyContent: 'flex-start' }}>Valores</a>
          <a href="#compromiso" className="btn btn-ghost" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.2rem', justifyContent: 'flex-start' }}>Compromiso</a>
          <div style={{ marginTop: 'auto', marginBottom: '32px' }}>
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full" style={{ fontSize: '1.2rem', padding: '16px', background: '#009C48' }}>
              Acceso al Sistema
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="proposito" className="landing-section container fade-in-up" style={{ paddingTop: '130px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Official Coco Express Banner Image */}
          <div style={{ 
            marginBottom: '32px', 
            display: 'inline-block',
            padding: '20px 32px',
            background: 'var(--surface-color)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 156, 72, 0.25)',
            boxShadow: '0 12px 32px rgba(0, 156, 72, 0.12)'
          }}>
            <img 
              src="https://i0.wp.com/cocoexpress.com.ec/wp-content/uploads/2023/07/logoCocoExpress.png?fit=1000%2C438&ssl=1" 
              alt="Coco Express Banner Oficial" 
              style={{ maxHeight: '110px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', background: 'rgba(0, 156, 72, 0.12)', 
              color: '#009C48', borderRadius: '30px', fontWeight: 700, marginBottom: '24px', fontSize: '0.95rem', border: '1px solid rgba(0, 156, 72, 0.25)'
            }}>
              <Award size={18} /> Franquiciado Estratégico de Coco Express ®
            </span>
          </div>

          <h1 className="text-3xl" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', lineHeight: 1.15, marginBottom: '24px', fontWeight: 800 }}>
            Transformando la <span className="gradient-text">Excelencia Operativa</span> en cada detalle.
          </h1>
          
          <p className="text-muted" style={{ fontSize: '1.2rem', marginBottom: '40px', lineHeight: 1.6, maxWidth: '760px', margin: '0 auto 40px auto' }}>
            Nuestra visión es garantizar la estandarización y calidad en todos nuestros puntos de venta, 
            asegurando que el cliente final experimente la promesa de marca de Coco Express en cada atención.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={() => navigate('/login')} className="btn btn-primary hover-lift" style={{ padding: '14px 32px', fontSize: '1.1rem', background: '#009C48', borderColor: '#009C48' }}>
              Ingresar al Sistema <ArrowRight size={20} />
            </button>
            <a href="#adn" className="btn btn-ghost hover-lift" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              Conoce nuestro ADN
            </a>
          </div>
        </div>
      </section>

      {/* ADN Section (Services/Values) */}
      <section id="adn" className="landing-section container">
        <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ color: '#f7b500', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.9rem' }}>Nuestra Identidad</span>
            <h2 className="text-3xl" style={{ marginTop: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>ADN GEDALUMA</h2>
            <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
              Nuestro éxito se fundamenta en cuatro pilares de gestión operativa, los cuales son de cumplimiento obligatorio en cada una de nuestras islas.
            </p>
          </div>
          
          <div className="grid grid-cols-2" style={{ gap: '24px' }}>
            <div className="glass-panel hover-lift" style={{ borderLeft: '4px solid #009C48' }}>
              <div style={{ color: '#009C48', marginBottom: '16px' }}><TrendingUp size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Excelencia en Frescura</h3>
              <p className="text-muted">
                La calidad del producto no es negociable. La gestión de temperaturas, estiba y rotación (FEFO) es el primer indicador de nuestra rentabilidad.
              </p>
            </div>
            
            <div className="glass-panel hover-lift" style={{ borderLeft: '4px solid #f7b500' }}>
              <div style={{ color: '#f7b500', marginBottom: '16px' }}><Heart size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Disciplina en el Servicio</h3>
              <p className="text-muted">
                La calidez en la atención es nuestro estándar. Cada cliente es un invitado y nuestro servicio debe reflejar el profesionalismo que nos define.
              </p>
            </div>
            
            <div className="glass-panel hover-lift" style={{ borderLeft: '4px solid #009C48' }}>
              <div style={{ color: '#009C48', marginBottom: '16px' }}><ShieldCheck size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Orden y Pulcritud (BPM)</h3>
              <p className="text-muted">
                La limpieza es un activo de la empresa. Una isla impecable es el primer indicativo de un proceso de gestión correcto.
              </p>
            </div>
            
            <div className="glass-panel hover-lift" style={{ borderLeft: '4px solid #f7b500' }}>
              <div style={{ color: '#f7b500', marginBottom: '16px' }}><Sparkles size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Pertenencia y Actitud</h3>
              <p className="text-muted">
                Somos embajadores de la marca. La puntualidad, el uso correcto del uniforme y la proactividad en la venta son pilares fundamentales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compromiso Section */}
      <section id="compromiso" className="landing-section container">
        <div className="glass-panel fade-in-up" style={{ 
          animationDelay: '0.4s', 
          background: 'linear-gradient(135deg, rgba(0, 156, 72, 0.08) 0%, rgba(247, 181, 0, 0.08) 100%)',
          border: '1px solid rgba(0, 156, 72, 0.2)',
          textAlign: 'center', padding: '64px 24px'
        }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(0, 156, 72, 0.15)', borderRadius: '50%', color: '#009C48', marginBottom: '20px' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-3xl gradient-text" style={{ marginBottom: '24px' }}>Crear valor en cada detalle</h2>
          <p className="text-muted" style={{ maxWidth: '800px', margin: '0 auto 32px auto', fontSize: '1.2rem', lineHeight: 1.6 }}>
            Nuestro propósito trasciende la transacción; buscamos la fidelización mediante un estándar de ejecución impecable. 
            Cada proceso, desde el control de inventarios hasta el servicio de atención, está diseñado para maximizar la satisfacción del cliente. 
            Convertir a un consumidor casual en un cliente recurrente es nuestra medida de éxito y el motor que impulsa el crecimiento de GEDALUMA.
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '4px 12px', 
            background: 'rgba(0, 156, 72, 0.12)', 
            border: '1px solid rgba(0, 156, 72, 0.25)', 
            borderRadius: '20px', 
            color: '#009C48', 
            fontWeight: 700, 
            fontSize: '0.8rem' 
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#009C48', display: 'inline-block' }}></span>
            {SYSTEM_VERSION.status}
          </span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', background: 'var(--surface-color)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            Versión {SYSTEM_VERSION.version}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>Última actualización: <strong>{SYSTEM_VERSION.lastUpdateDate}</strong></span>
        </div>
        <p>© {new Date().getFullYear()} GEDALUMA. Franquiciado Estratégico de Coco Express ®. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Sparkles, TrendingUp, Menu, X } from 'lucide-react';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo-wide.png" alt="Gedaluma Logo" style={{ height: '45px', width: 'auto' }} />
        </div>
        
        <div className="flex gap-4 items-center hidden-mobile">
          <a href="#proposito" className="btn btn-ghost" style={{ border: 'none' }}>Visión</a>
          <a href="#adn" className="btn btn-ghost" style={{ border: 'none' }}>Valores</a>
          <a href="#compromiso" className="btn btn-ghost" style={{ border: 'none' }}>Compromiso</a>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginLeft: '16px' }}>
            Acceso
          </button>
        </div>
        
        {/* Mobile menu toggle */}
        <div className="show-mobile">
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
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full" style={{ fontSize: '1.2rem', padding: '16px' }}>
              Acceso al Sistema
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="proposito" className="landing-section container fade-in-up" style={{ paddingTop: '120px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ 
            display: 'inline-block', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', 
            color: 'var(--primary)', borderRadius: '20px', fontWeight: 600, marginBottom: '24px', fontSize: '0.9rem'
          }}>
            Franquiciado Estratégico de Coco Express
          </span>
          <h1 className="text-3xl" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '24px' }}>
            Transformando la <span className="gradient-text">Excelencia Operativa</span> en cada detalle.
          </h1>
          <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '40px', lineHeight: 1.6 }}>
            Nuestra visión es garantizar la estandarización y calidad en todos nuestros puntos de venta, 
            asegurando que el cliente final experimente la promesa de marca de Coco Express en cada atención.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#adn" className="btn btn-ghost hover-lift" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
              Conoce nuestro ADN <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* ADN Section (Services/Values) */}
      <section id="adn" className="landing-section container">
        <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="text-3xl" style={{ marginBottom: '16px' }}>ADN GEDALUMA</h2>
            <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
              Nuestro éxito se fundamenta en cuatro pilares de gestión operativa, los cuales son de cumplimiento obligatorio en cada una de nuestras islas.
            </p>
          </div>
          
          <div className="grid grid-cols-2" style={{ gap: '24px' }}>
            <div className="glass-panel hover-lift">
              <div style={{ color: 'var(--success)', marginBottom: '16px' }}><TrendingUp size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Excelencia en Frescura</h3>
              <p className="text-muted">
                La calidad del producto no es negociable. La gestión de temperaturas, estiba y rotación (FEFO) es el primer indicador de nuestra rentabilidad.
              </p>
            </div>
            
            <div className="glass-panel hover-lift">
              <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Heart size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Disciplina en el Servicio</h3>
              <p className="text-muted">
                La calidez en la atención es nuestro estándar. Cada cliente es un invitado y nuestro servicio debe reflejar el profesionalismo que nos define.
              </p>
            </div>
            
            <div className="glass-panel hover-lift">
              <div style={{ color: '#8b5cf6', marginBottom: '16px' }}><ShieldCheck size={32} /></div>
              <h3 className="text-xl" style={{ marginBottom: '12px' }}>Orden y Pulcritud (BPM)</h3>
              <p className="text-muted">
                La limpieza es un activo de la empresa. Una isla impecable es el primer indicativo de un proceso de gestión correcto.
              </p>
            </div>
            
            <div className="glass-panel hover-lift">
              <div style={{ color: 'var(--warning)', marginBottom: '16px' }}><Sparkles size={32} /></div>
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
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
          textAlign: 'center', padding: '64px 24px'
        }}>
          <h2 className="text-3xl gradient-text" style={{ marginBottom: '24px' }}>Crear valor en cada detalle</h2>
          <p className="text-muted" style={{ maxWidth: '800px', margin: '0 auto 32px auto', fontSize: '1.2rem', lineHeight: 1.6 }}>
            Nuestro propósito trasciende la transacción; buscamos la fidelización mediante un estándar de ejecución impecable. 
            Cada proceso, desde el control de inventarios hasta el servicio de atención, está diseñado para maximizar la satisfacción del cliente. 
            Convertir a un consumidor casual en un cliente recurrente es nuestra medida de éxito y el motor que impulsa el crecimiento de GEDALUMA.
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
        <p>© {new Date().getFullYear()} GEDALUMA. Franquiciado Estratégico de Coco Express.</p>
      </footer>
    </div>
  );
}

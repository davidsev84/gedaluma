import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Mail, Copy, Check, ExternalLink, X } from 'lucide-react';
import { SYSTEM_VERSION } from '../config/version';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Recovery modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{ resetUrl: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { login, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(username, password);
    
    setIsLoading(false);
    if (result.success) {
      navigate('/app');
    } else {
      setError(result.error || 'Credenciales incorrectas. Inténtalo de nuevo.');
      setPassword('');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryLoading(true);

    const res = await requestPasswordReset(recoveryEmail);
    setRecoveryLoading(false);

    if (res.success && res.resetUrl) {
      setRecoveryResult({
        resetUrl: res.resetUrl,
        email: recoveryEmail.trim().toLowerCase()
      });
    } else {
      setRecoveryError(res.error || 'No se pudo procesar la solicitud de recuperación.');
    }
  };

  const handleCopyLink = () => {
    if (recoveryResult?.resetUrl) {
      navigator.clipboard.writeText(recoveryResult.resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getMailtoUrl = () => {
    if (!recoveryResult) return '#';
    const subject = encodeURIComponent('Recuperación de Contraseña - Sistema GEDALUMA');
    const body = encodeURIComponent(
      `Hola,\n\nHas solicitado restablecer tu contraseña en el sistema GEDALUMA.\n\nHaz clic en el siguiente enlace seguro para crear tu nueva contraseña:\n${recoveryResult.resetUrl}\n\nEste enlace es válido por 1 hora.\n\nSi no realizaste esta solicitud, puedes ignorar este mensaje.\n\nEquipo GEDALUMA`
    );
    return `mailto:${recoveryResult.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ padding: '16px', background: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px 24px' }}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div style={{ marginBottom: '8px' }}>
            <img src="/logo.png" alt="Gedaluma Logo" style={{ height: '110px', width: 'auto' }} />
          </div>
          <h1 className="text-2xl text-center font-bold">Acceso al Sistema</h1>
          <p className="text-muted text-center" style={{ fontSize: '0.88rem' }}>Inicia sesión con tu usuario o correo electrónico</p>
          
          <a 
            href="/" 
            className="btn btn-outline flex items-center gap-2 justify-center"
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.82rem', 
              borderRadius: '8px', 
              borderColor: '#009C48', 
              color: '#009C48',
              textDecoration: 'none',
              fontWeight: 700,
              width: '100%'
            }}
          >
            ← Volver a la Página Principal (Inicio)
          </a>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label htmlFor="username" className="form-label" style={{ fontWeight: 600 }}>Usuario o Correo Electrónico</label>
            <div className="flex items-center form-control" style={{ padding: '0 12px', gap: '8px' }}>
              <UserIcon size={18} className="text-muted" />
              <input
                id="username"
                type="text"
                className="w-full"
                style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', flex: 1, color: 'var(--text-primary)' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. fbrito o fbritonetica@gmail.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
              <label htmlFor="password" className="form-label" style={{ margin: 0, fontWeight: 600 }}>Contraseña</label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setRecoveryResult(null);
                  setRecoveryError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#009C48',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="flex items-center form-control" style={{ padding: '0 12px', gap: '8px' }}>
              <Lock size={18} className="text-muted" />
              <input
                id="password"
                type="password"
                className="w-full"
                style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', flex: 1, color: 'var(--text-primary)' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
          </div>
          
          {error && <p className="text-danger text-center" style={{ fontSize: '0.88rem', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px', padding: '12px', fontWeight: 700 }} disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 9999,
          backdropFilter: 'blur(3px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative', background: 'var(--surface-color)' }}>
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              title="Cerrar"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={22} style={{ color: '#009C48' }} /> Recuperar Contraseña
            </h2>

            {!recoveryResult ? (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4" style={{ marginTop: '12px' }}>
                <p className="text-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
                  Ingresa tu correo electrónico registrado y te enviaremos el enlace para crear una nueva clave.
                </p>

                <div className="form-group">
                  <label htmlFor="recoveryEmail" className="form-label" style={{ fontWeight: 600 }}>Correo Electrónico *</label>
                  <div className="flex items-center form-control" style={{ padding: '0 12px', gap: '8px' }}>
                    <Mail size={18} className="text-muted" />
                    <input
                      id="recoveryEmail"
                      type="email"
                      className="w-full"
                      style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', flex: 1, color: 'var(--text-primary)' }}
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {recoveryError && (
                  <p className="text-danger" style={{ fontSize: '0.85rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', margin: 0 }}>
                    {recoveryError}
                  </p>
                )}

                <div className="flex gap-2" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '10px', fontWeight: 700 }}
                    disabled={recoveryLoading}
                  >
                    {recoveryLoading ? 'Verificando...' : 'Enviar Enlace'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3" style={{ marginTop: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(0, 156, 72, 0.1)', border: '1px solid #009C48', borderRadius: '8px', color: '#007a38', fontSize: '0.88rem' }}>
                  <strong>✓ Enlace de recuperación generado</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>
                    Se ha generado el enlace seguro para <strong>{recoveryResult.email}</strong>.
                  </p>
                </div>

                <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0 }}>
                  Puedes abrir tu correo para enviar el enlace o copiarlo directamente para cambiar tu contraseña:
                </p>

                <div className="flex flex-col gap-2" style={{ marginTop: '4px' }}>
                  <a
                    href={getMailtoUrl()}
                    className="btn btn-primary flex items-center justify-center gap-2"
                    style={{ padding: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '0.86rem' }}
                  >
                    <Mail size={16} /> Enviar enlace a mi Correo
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-outline flex items-center justify-center gap-2"
                    style={{ padding: '10px', fontSize: '0.86rem', borderColor: copied ? '#009C48' : 'var(--border-color)', color: copied ? '#009C48' : 'inherit' }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace al portapapeles'}
                  </button>

                  <a
                    href={recoveryResult.resetUrl}
                    className="btn btn-ghost flex items-center justify-center gap-2"
                    style={{ padding: '8px', fontSize: '0.82rem', color: '#009C48' }}
                  >
                    <ExternalLink size={14} /> Abrir enlace para restablecer clave ahora →
                  </a>
                </div>

                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn btn-outline"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer de Versión y Estado del Sistema */}
      <footer style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '3px 10px', 
            background: 'rgba(0, 156, 72, 0.12)', 
            border: '1px solid rgba(0, 156, 72, 0.25)', 
            borderRadius: '12px', 
            color: '#009C48', 
            fontWeight: 700, 
            fontSize: '0.78rem' 
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#009C48', display: 'inline-block' }}></span>
            {SYSTEM_VERSION.status}
          </span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', background: 'var(--surface-color)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {SYSTEM_VERSION.version}
          </span>
        </div>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Última actualización: <strong>{SYSTEM_VERSION.lastUpdateDate}</strong>
        </p>
        <p style={{ margin: '4px 0 0 0', opacity: 0.65, fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} GEDALUMA. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Falta el correo electrónico asociado en el enlace.');
      return;
    }

    if (newPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(email, token, newPassword);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      setError(res.error || 'Ocurrió un error al restablecer la contraseña.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ padding: '16px', background: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px 24px' }}>
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src="/logo.png" alt="Gedaluma Logo" style={{ height: '90px', width: 'auto', marginBottom: '8px' }} />
          <h1 className="text-2xl text-center font-bold" style={{ color: 'var(--text-primary)' }}>
            Restablecer Contraseña
          </h1>
          <p className="text-muted text-center" style={{ fontSize: '0.88rem' }}>
            {email ? (
              <>Crea una nueva contraseña para <strong>{email}</strong></>
            ) : (
              'Ingresa tu nueva contraseña para acceder al sistema'
            )}
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 text-center" style={{ padding: '16px 0' }}>
            <div style={{ color: '#009C48', background: 'rgba(0, 156, 72, 0.1)', padding: '16px', borderRadius: '50%' }}>
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#009C48' }}>
              ¡Contraseña Actualizada!
            </h2>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-block"
              style={{ marginTop: '12px', padding: '12px' }}
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!email && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#dc2626', fontSize: '0.86rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={18} />
                <span>Enlace incompleto: no se especificó correo para el restablecimiento.</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label" style={{ fontWeight: 600 }}>
                Nueva Contraseña *
              </label>
              <div className="flex items-center form-control" style={{ padding: '0 12px', gap: '8px' }}>
                <Lock size={18} className="text-muted" />
                <input
                  id="newPassword"
                  type="password"
                  className="w-full"
                  style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', flex: 1, color: 'var(--text-primary)' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label" style={{ fontWeight: 600 }}>
                Confirmar Nueva Contraseña *
              </label>
              <div className="flex items-center form-control" style={{ padding: '0 12px', gap: '8px' }}>
                <Lock size={18} className="text-muted" />
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full"
                  style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', flex: 1, color: 'var(--text-primary)' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-danger text-center" style={{ fontSize: '0.88rem', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '8px', padding: '12px', fontWeight: 700 }}
              disabled={isLoading || !email}
            >
              {isLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>

            <div className="text-center" style={{ marginTop: '8px' }}>
              <Link
                to="/login"
                className="flex items-center justify-center gap-1 text-muted"
                style={{ fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <ArrowLeft size={16} /> Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default ResetPassword;

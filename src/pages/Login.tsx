import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ padding: '16px', background: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div style={{ marginBottom: '16px' }}>
            <img src="/logo.png" alt="Gedaluma Logo" style={{ height: '120px', width: 'auto' }} />
          </div>
          <h1 className="text-2xl text-center">Acceso al Sistema</h1>
          <p className="text-muted text-center">Inicia sesión con tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Usuario</label>
            <div className="flex items-center form-control" style={{ padding: '0 12px', gap: '8px' }}>
              <UserIcon size={18} className="text-muted" />
              <input
                id="username"
                type="text"
                className="w-full"
                style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', flex: 1, color: 'var(--text-primary)' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña</label>
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
          
          {error && <p className="text-danger text-center" style={{ fontSize: '0.9rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px' }} disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </button>
          
          <button type="button" onClick={() => navigate('/')} className="btn btn-ghost btn-block" style={{ marginTop: '8px' }}>
            Volver al Inicio
          </button>
        </form>
      </div>
    </div>
  );
}

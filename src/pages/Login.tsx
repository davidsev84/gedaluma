import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(pin)) {
      navigate('/');
    } else {
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ padding: '16px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div style={{ background: 'var(--primary)', padding: '16px', borderRadius: '50%', color: 'white' }}>
            <Lock size={32} />
          </div>
          <h1 className="text-2xl text-center">Gestión de Gedaluma</h1>
          <p className="text-muted text-center">Sistema de Evaluación y Auditoría</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label htmlFor="pin" className="form-label">PIN de Acceso</label>
            <input
              id="pin"
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              className="form-control"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ingresa tu PIN"
              required
              autoFocus
            />
          </div>
          
          {error && <p className="text-danger text-center" style={{ fontSize: '0.9rem' }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
            Ingresar
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            PIN de prueba: Admin (1234), Evaluador (5678), Fantasma (0000)
          </p>
        </div>
      </div>
    </div>
  );
}

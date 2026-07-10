import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { mockIslas, mockEmployees, categories } from '../data/mock';

export function Dashboard() {
  const { user, logout } = useAuth();

  // Generar puntajes ficticios para la demo antes de Supabase
  const catScores = categories.map((c, i) => ({
    name: c.name,
    score: 85 - (i * 3) // Simulando diferentes puntajes
  })).sort((a, b) => b.score - a.score);
  
  const criticalCat = catScores[catScores.length - 1]; // La más baja

  const islaScores = mockIslas.map((isla, i) => ({
    name: isla.name,
    score: 95 - (i * 4)
  })).sort((a, b) => b.score - a.score);
  
  const bestIsla = islaScores[0]; // La más alta

  const empScores = mockEmployees.map((emp, i) => ({
    name: emp.name,
    score: 90 - (i % 5) * 5 + (i % 2) * 2 // Puntajes variados
  })).sort((a, b) => b.score - a.score);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 75) return 'var(--primary)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl">Panel de Control General</h1>
          <p className="text-muted">Bienvenido, {user?.name}</p>
        </div>
        <button onClick={logout} className="btn btn-ghost">
          <LogOut size={20} />
          <span>Salir</span>
        </button>
      </header>

      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '32px' }}>
        <div className="card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 size={24} />
            <h2 className="text-xl">Promedio Gral.</h2>
          </div>
          <p className="text-3xl">82.4<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/100</span></p>
        </div>
        
        <div className="card flex flex-col gap-2" style={{ border: '1px solid var(--danger)' }}>
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={24} />
            <h2 className="text-xl">Alerta Categoría</h2>
          </div>
          <p className="text-xl" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{criticalCat.name}</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Puntaje Crítico: {criticalCat.score}%</p>
        </div>

        <div className="card flex flex-col gap-2" style={{ border: '1px solid var(--success)' }}>
          <div className="flex items-center gap-2 text-success">
            <TrendingUp size={24} />
            <h2 className="text-xl">Isla Destacada</h2>
          </div>
          <p className="text-xl">{bestIsla.name}</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Puntaje Máximo: {bestIsla.score}%</p>
        </div>

        <div className="card flex flex-col gap-2">
          <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <Users size={24} />
            <h2 className="text-xl">Personal Eval.</h2>
          </div>
          <p className="text-3xl">{mockEmployees.length}</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Auditados este mes</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Tabla Categorias */}
        <div className="card">
          <h2 className="text-xl" style={{ marginBottom: '16px' }}>Desempeño por Categoría</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Categoría</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {catScores.map(cat => (
                  <tr key={cat.name} style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    background: cat.name === criticalCat.name ? 'rgba(239, 68, 68, 0.1)' : 'transparent' 
                  }}>
                    <td style={{ padding: '12px 8px', fontWeight: cat.name === criticalCat.name ? 'bold' : 'normal', color: cat.name === criticalCat.name ? 'var(--danger)' : 'inherit' }}>
                      {cat.name}
                      {cat.name === criticalCat.name && <AlertTriangle size={14} style={{ display: 'inline', marginLeft: '6px' }} />}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(cat.score) }}>
                      {cat.score}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Islas */}
        <div className="card">
          <h2 className="text-xl" style={{ marginBottom: '16px' }}>Ranking de Islas</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Isla</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {islaScores.map(isla => (
                  <tr key={isla.name} style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    background: isla.name === bestIsla.name ? 'rgba(34, 197, 94, 0.1)' : 'transparent' 
                  }}>
                    <td style={{ padding: '12px 8px', fontWeight: isla.name === bestIsla.name ? 'bold' : 'normal', color: isla.name === bestIsla.name ? 'var(--success)' : 'inherit' }}>
                      {isla.name}
                      {isla.name === bestIsla.name && <TrendingUp size={14} style={{ display: 'inline', marginLeft: '6px' }} />}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(isla.score) }}>
                      {isla.score}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Empleados */}
        <div className="card">
          <h2 className="text-xl" style={{ marginBottom: '16px' }}>Ranking de Empleados</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Empleado</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {empScores.map((emp, i) => (
                  <tr key={emp.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>#{i+1}</span>
                      {emp.name}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(emp.score) }}>
                      {emp.score}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

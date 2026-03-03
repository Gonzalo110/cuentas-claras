import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft } from 'lucide-react';

export default function NewGroup() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const group = await api.createGroup({ name, description });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
        <ArrowLeft size={18} />
        <span className="text-sm">Volver</span>
      </button>

      <h2 className="text-xl font-bold text-slate-800">Nuevo Grupo</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4">
        {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Nombre del grupo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="Ej: Viaje a Bariloche"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Descripción (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="Ej: Gastos del viaje de enero"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear grupo'}
        </button>
      </form>
    </div>
  );
}

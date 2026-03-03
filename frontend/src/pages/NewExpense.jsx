import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function NewExpense() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(groupId || '');
  const [group, setGroup] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId) {
      api.listGroups().then(setGroups).catch(console.error);
    }
  }, [groupId]);

  useEffect(() => {
    if (selectedGroup) {
      api.getGroup(selectedGroup).then((g) => {
        setGroup(g);
        setPaidBy(user.id);
        setSplits(g.members.map((m) => ({ user_id: m.user_id, amount: 0, percentage: 0 })));
      }).catch(console.error);
    }
  }, [selectedGroup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        description,
        amount: parseFloat(amount),
        paid_by: paidBy,
        split_type: splitType,
      };

      if (splitType === 'percentage') {
        const total = splits.reduce((sum, s) => sum + s.percentage, 0);
        if (Math.abs(total - 100) > 0.01) {
          setError('Los porcentajes deben sumar 100%');
          setLoading(false);
          return;
        }
        payload.splits = splits;
      } else if (splitType === 'exact') {
        const total = splits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          setError(`Los montos deben sumar $${amount}`);
          setLoading(false);
          return;
        }
        payload.splits = splits;
      }

      await api.createExpense(selectedGroup, payload);
      navigate(groupId ? `/groups/${groupId}` : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Volver</span>
      </button>

      <h2 className="text-xl font-bold text-slate-800">Nuevo Gasto</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4">
        {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}

        {!groupId && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Grupo</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              required
            >
              <option value="">Seleccionar grupo</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Ej: Cena, Supermercado, etc."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Monto (ARS)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="0.00"
            required
          />
        </div>

        {group && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">¿Quién pagó?</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {group.members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_name} {m.user_id === user.id ? '(Yo)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Dividir</label>
          <div className="flex bg-slate-50 rounded-xl p-1 gap-1">
            {[
              { value: 'equal', label: 'Partes iguales' },
              { value: 'percentage', label: 'Porcentaje' },
              { value: 'exact', label: 'Monto exacto' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSplitType(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  splitType === opt.value
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {splitType !== 'equal' && group && (
          <div className="space-y-2">
            {group.members.map((m, idx) => (
              <div key={m.user_id} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 flex-1">{m.user_name}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={splitType === 'percentage' ? splits[idx]?.percentage || '' : splits[idx]?.amount || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSplits((prev) =>
                      prev.map((s, i) =>
                        i === idx
                          ? { ...s, [splitType === 'percentage' ? 'percentage' : 'amount']: val }
                          : s
                      )
                    );
                  }}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder={splitType === 'percentage' ? '%' : '$'}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedGroup}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar gasto'}
        </button>
      </form>
    </div>
  );
}

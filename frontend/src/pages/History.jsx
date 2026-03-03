import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatMoney, formatDateTime } from '../lib/format';
import { Receipt, ArrowRight, Check } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listGroups().then(setGroups).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      setLoading(true);
      Promise.all([
        api.listExpenses(selectedGroup),
        api.listGroupPayments(selectedGroup),
      ])
        .then(([e, p]) => {
          setExpenses(e);
          setPayments(p);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedGroup]);

  const allItems = [
    ...expenses.map((e) => ({ type: 'expense', data: e, date: e.created_at })),
    ...payments.map((p) => ({ type: 'payment', data: p, date: p.created_at })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800">Historial</h2>

      <select
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
      >
        <option value="">Seleccionar grupo</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>

      {!selectedGroup && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <Receipt size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">Seleccioná un grupo para ver el historial</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {selectedGroup && !loading && allItems.length === 0 && (
        <div className="bg-white rounded-xl p-6 text-center text-slate-400">
          No hay movimientos en este grupo
        </div>
      )}

      {!loading && allItems.length > 0 && (
        <div className="space-y-3">
          {allItems.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-4">
              {item.type === 'expense' ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <Receipt size={14} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{item.data.description}</p>
                        <p className="text-xs text-slate-400">
                          Pagó {item.data.paid_by === user.id ? 'Vos' : item.data.paid_by_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatMoney(item.data.amount)}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(item.data.created_at)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.data.is_settled ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {item.data.is_settled ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <ArrowRight size={14} className="text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {item.data.from_user_id === user.id ? 'Vos' : item.data.from_user_name}
                        {' '}<ArrowRight size={12} className="inline text-slate-400" />{' '}
                        {item.data.to_user_id === user.id ? 'Vos' : item.data.to_user_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.data.is_settled ? 'Saldado' : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatMoney(item.data.amount)}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(item.data.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

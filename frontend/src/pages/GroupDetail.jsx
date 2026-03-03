import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatMoney, formatDateTime } from '../lib/format';
import {
  ArrowLeft, Plus, Users, Receipt, BarChart3, Share2, Copy,
  Check, Trash2, CreditCard, ArrowRight, Pencil, X
} from 'lucide-react';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('balances');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Confirm settle dialog
  const [settleConfirm, setSettleConfirm] = useState(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [g, e, b, p] = await Promise.all([
        api.getGroup(id),
        api.listExpenses(id),
        api.getBalances(id),
        api.listGroupPayments(id),
      ]);
      setGroup(g);
      setExpenses(e);
      setBalances(b);
      setPayments(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${group.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await api.deleteExpense(id, expenseId);
    loadData();
  };

  const handleSettle = async (debt) => {
    try {
      const payment = await api.createPayment({
        group_id: id,
        to_user_id: debt.to_user_id,
        amount: debt.amount,
      });
      await api.settlePayment(payment.id);
      setSettleConfirm(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMercadoPago = async (debt) => {
    try {
      const payment = await api.createPayment({
        group_id: id,
        to_user_id: debt.to_user_id,
        amount: debt.amount,
      });
      const pref = await api.createMercadoPagoPreference(payment.id);
      window.open(pref.init_point, '_blank');
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditing = () => {
    setEditName(group.name);
    setEditDesc(group.description || '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await api.updateGroup(id, { name: editName, description: editDesc });
      setGroup(updated);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.deleteGroup(id);
      navigate('/groups');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="bg-white rounded-2xl p-6 h-40" />
      </div>
    );
  }

  if (!group) return <p className="text-center text-slate-500 mt-10">Grupo no encontrado</p>;

  const isCreator = group.created_by === user.id;

  const tabs = [
    { key: 'balances', label: 'Balances', icon: BarChart3 },
    { key: 'expenses', label: 'Gastos', icon: Receipt },
    { key: 'members', label: 'Miembros', icon: Users },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Settle confirmation modal */}
      {settleConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Confirmar pago</h3>
            <p className="text-slate-600">
              ¿Marcar como saldada la deuda de{' '}
              <span className="font-semibold">{formatMoney(settleConfirm.amount)}</span>{' '}
              a <span className="font-semibold">{settleConfirm.to_user_name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSettleConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSettle(settleConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-success text-white font-medium hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-danger">Eliminar grupo</h3>
            <p className="text-slate-600">
              ¿Estás seguro de que querés eliminar <span className="font-semibold">"{group.name}"</span>?
              Se eliminarán todos los gastos y pagos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 py-2.5 rounded-xl bg-danger text-white font-medium hover:opacity-90 transition-opacity"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/groups')} className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
          <ArrowLeft size={18} />
          <span className="text-sm">Grupos</span>
        </button>
        <div className="flex items-center gap-2">
          {isCreator && (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-danger font-medium"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copiado!' : 'Invitar'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="bg-white rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Nombre del grupo"
          />
          <input
            type="text"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Descripción (opcional)"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              <Check size={14} />
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{group.name}</h2>
          {group.description && <p className="text-slate-500 text-sm">{group.description}</p>}
        </div>
      )}

      <Link
        to={`/groups/${id}/new-expense`}
        className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
      >
        <Plus size={18} />
        Agregar gasto
      </Link>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 gap-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-primary-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'balances' && balances && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700">Balance de cada miembro</h3>
          {balances.balances.map((b) => (
            <div key={b.user_id} className="bg-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{b.user_name}</p>
                <p className="text-xs text-slate-400">{b.user_id === user.id ? '(Vos)' : ''}</p>
              </div>
              <span
                className={`font-bold text-lg ${
                  b.balance > 0 ? 'text-success' : b.balance < 0 ? 'text-danger' : 'text-slate-400'
                }`}
              >
                {b.balance > 0 ? '+' : ''}{formatMoney(b.balance)}
              </span>
            </div>
          ))}

          {balances.simplified_debts.length > 0 && (
            <>
              <h3 className="font-semibold text-slate-700 mt-4">Deudas simplificadas</h3>
              {balances.simplified_debts.map((debt, i) => (
                <div key={i} className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700">
                      {debt.from_user_id === user.id ? 'Vos' : debt.from_user_name}
                    </span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {debt.to_user_id === user.id ? 'Vos' : debt.to_user_name}
                    </span>
                    <span className="ml-auto font-bold text-danger">{formatMoney(debt.amount)}</span>
                  </div>
                  {debt.from_user_id === user.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSettleConfirm(debt)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-success text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Check size={14} />
                        Marcar saldada
                      </button>
                      <button
                        onClick={() => handleMercadoPago(debt)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-sky-500 text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <CreditCard size={14} />
                        Mercado Pago
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {balances.simplified_debts.length === 0 && (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Check size={24} className="mx-auto text-success mb-1" />
              <p className="text-success font-medium">Todas las cuentas están saldadas</p>
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-slate-400">
              No hay gastos registrados
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{expense.description}</p>
                    <p className="text-xs text-slate-400">
                      Pagó {expense.paid_by === user.id ? 'Vos' : expense.paid_by_name} · {formatDateTime(expense.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{formatMoney(expense.amount)}</span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-1 text-slate-300 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {expense.splits.map((s) => (
                    <span key={s.id} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {s.user_name}: {formatMoney(s.amount)}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-3">
          {group.members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">
                  {m.user_name} {m.user_id === user.id && <span className="text-primary-500">(Vos)</span>}
                </p>
                <p className="text-xs text-slate-400">{m.user_email}</p>
              </div>
              {m.user_id === group.created_by && (
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Admin</span>
              )}
            </div>
          ))}

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Link de invitación</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white p-2 rounded-lg text-slate-500 break-all border">
                {window.location.origin}/invite/{group.invite_code}
              </code>
              <button
                onClick={copyInviteLink}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

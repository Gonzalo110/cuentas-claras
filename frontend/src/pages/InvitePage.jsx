import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, LogIn, UserPlus } from 'lucide-react';

export default function InvitePage() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getGroupPublicInfo(code)
      .then(setGroupInfo)
      .catch(() => setError('Link de invitación inválido'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!user) {
      navigate(`/register?invite=${code}`);
      return;
    }
    setJoining(true);
    try {
      const group = await api.joinGroup(code);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-2xl font-bold text-white">Cuentas Claras</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
          {error ? (
            <div className="text-center">
              <p className="text-danger mb-4">{error}</p>
              <Link to="/" className="text-primary-600 font-medium hover:underline">
                Ir al inicio
              </Link>
            </div>
          ) : groupInfo ? (
            <>
              <div className="text-center">
                <Users size={40} className="mx-auto text-primary-500 mb-2" />
                <h2 className="text-xl font-bold text-slate-800">Te invitaron a</h2>
                <h3 className="text-2xl font-bold text-primary-600 mt-1">{groupInfo.name}</h3>
                {groupInfo.description && (
                  <p className="text-slate-500 text-sm mt-1">{groupInfo.description}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {groupInfo.member_count} {groupInfo.member_count === 1 ? 'miembro' : 'miembros'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {groupInfo.members.map((name, i) => (
                    <span key={i} className="text-xs bg-white text-slate-500 px-2 py-0.5 rounded-full border">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {user ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus size={18} />
                  {joining ? 'Uniéndose...' : 'Unirme al grupo'}
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    to={`/register?invite=${code}`}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    Registrarme y unirme
                  </Link>
                  <Link
                    to={`/login?invite=${code}`}
                    className="w-full bg-white border-2 border-primary-600 text-primary-600 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn size={18} />
                    Ya tengo cuenta
                  </Link>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

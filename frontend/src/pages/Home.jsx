import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Plus, Users, ChevronRight } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listGroups().then(setGroups).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <p className="text-primary-200 text-sm">Bienvenido/a</p>
        <h2 className="text-2xl font-bold mt-1">{user?.name}</h2>
        <p className="text-primary-200 text-sm mt-2">
          {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} activos
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Mis Grupos</h3>
        <Link
          to="/groups/new"
          className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700"
        >
          <Plus size={16} />
          Nuevo grupo
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 mb-4">Todavía no tenés grupos</p>
          <Link
            to="/groups/new"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            Crear mi primer grupo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-md transition-all border border-slate-100"
            >
              <div>
                <h4 className="font-semibold text-slate-800">{group.name}</h4>
                <p className="text-sm text-slate-400">
                  {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
                  {group.description && ` · ${group.description}`}
                </p>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

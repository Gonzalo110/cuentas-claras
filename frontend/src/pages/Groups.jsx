import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { formatDate } from '../lib/format';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listGroups().then(setGroups).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Grupos</h2>
        <Link
          to="/groups/new"
          className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No hay grupos todavía</p>
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
                  {group.member_count} miembros · {formatDate(group.created_at)}
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

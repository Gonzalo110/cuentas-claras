import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function PaymentResult() {
  const { status, paymentId } = useParams();

  const config = {
    success: {
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-green-50',
      title: 'Pago exitoso',
      message: 'Tu deuda fue saldada correctamente.',
    },
    failure: {
      icon: XCircle,
      color: 'text-danger',
      bg: 'bg-red-50',
      title: 'Pago fallido',
      message: 'El pago no se pudo procesar. Intentá nuevamente.',
    },
    pending: {
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-yellow-50',
      title: 'Pago pendiente',
      message: 'Tu pago está siendo procesado. Se actualizará automáticamente.',
    },
  };

  const current = config[status] || config.pending;
  const Icon = current.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className={`max-w-sm w-full ${current.bg} rounded-2xl p-8 text-center animate-slide-up`}>
        <Icon size={64} className={`mx-auto ${current.color} mb-4`} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{current.title}</h2>
        <p className="text-slate-500 mb-6">{current.message}</p>
        <Link
          to="/"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

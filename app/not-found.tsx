import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Página não encontrada</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        Desculpe, a página que você está procurando não existe ou foi movida.
      </p>
      <Link 
        href="/"
        className="bg-primary text-white font-black px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-widest text-sm"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}

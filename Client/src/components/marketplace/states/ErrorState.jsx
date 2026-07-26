import { AlertCircle, RefreshCw } from "lucide-react";

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <AlertCircle size={40} className="text-red-400" />
      <h2 className="mt-4 text-xl font-semibold text-white">Could not load listings</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-400">{message}</p>
      <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
};

export default ErrorState;

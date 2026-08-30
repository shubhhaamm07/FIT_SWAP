import { Component } from "react";
import { CircleAlert, Home, RefreshCw } from "lucide-react";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, details) {
    console.error("FitSwap interface error", error, details);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-[#08090d] px-4 py-10 text-white">
        <section className="w-full max-w-md rounded-3xl border border-red-400/20 bg-[#11121a] p-6 text-center shadow-2xl shadow-black/40 sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/10 text-red-300">
            <CircleAlert size={27} />
          </span>
          <h1 className="mt-5 text-2xl font-bold">This page could not finish loading</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Your account and data are safe. Refresh the page to load the latest version of FitSwap.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
            >
              <Home size={16} /> Go home
            </button>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;

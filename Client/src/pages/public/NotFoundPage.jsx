import { Link } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import PageMetadata from "../../seo/PageMetadata";

export default function NotFoundPage() {
  return <PublicLayout><PageMetadata title="Page Not Found | FitSwap" description="This FitSwap page could not be found. Browse memberships or return home." noindex />
    <div className="py-20 text-center"><p className="font-bold text-violet-300">404</p><h1 className="mt-4 text-4xl font-bold">This page isn’t here.</h1><p className="mt-4 text-zinc-400">The address may be incorrect or the page may have moved.</p><Link to="/marketplace" className="mt-7 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold">Browse memberships</Link><Link to="/" className="ml-5 text-sm text-violet-200">Go home</Link></div>
  </PublicLayout>;
}

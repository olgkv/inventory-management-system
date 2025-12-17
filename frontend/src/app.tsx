import { API_BASE_URL } from './lib/api';

function App() {
	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<main className="mx-auto max-w-3xl px-4 py-10">
				<h1 className="text-3xl font-semibold tracking-tight">Inventory Management</h1>
				<p className="mt-2 text-sm text-slate-600">API: {API_BASE_URL}</p>

				<div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
					<p className="text-sm text-slate-700">
						Frontend scaffolded with Vite + React + TypeScript + Tailwind.
					</p>
				</div>
			</main>
		</div>
	);
}

export default App;

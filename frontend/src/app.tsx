import { API_BASE_URL } from './shared/api';
import { ProductsPage } from './pages/products-page';

function App() {
	return (
		<div className="min-h-screen bg-slate-50 text-slate-900">
			<main className="mx-auto max-w-6xl px-4 py-10">
				<div className="flex items-end justify-between gap-4">
					<div>
						<h1 className="text-3xl font-semibold tracking-tight">Inventory Management</h1>
						<p className="mt-2 text-sm text-slate-600">API: {API_BASE_URL}</p>
					</div>
				</div>

				<ProductsPage />
			</main>
		</div>
	);
}

export default App;

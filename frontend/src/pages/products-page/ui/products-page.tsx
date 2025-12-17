import { useCallback, useEffect, useState } from 'react';

import type { Product } from '../../../entities/product/model/types';

import { getProducts } from '../../../entities/product/api/get-products';

type ProductsPageProps = {
	pageSize?: number;
};

export function ProductsPage(props: ProductsPageProps) {
	const pageSize = props.pageSize ?? 20;

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState(0);

	const load = useCallback(
		async (signal?: AbortSignal) => {
			setIsLoading(true);
			setError(null);

			try {
				const json = await getProducts({ page: 1, limit: pageSize }, signal);
				setProducts(json.data);
				setTotal(json.total);
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') {
					return;
				}
				setError(e instanceof Error ? e.message : 'Unknown error');
			} finally {
				setIsLoading(false);
			}
		},
		[pageSize]
	);

	useEffect(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	}, [load]);

	return (
		<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-lg font-semibold">Products</h2>
				<p className="text-sm text-slate-600">Total: {total}</p>
			</div>

			{isLoading ? (
				<div className="mt-6 text-sm text-slate-600">Loading...</div>
			) : error ? (
				<div className="mt-6">
					<p className="text-sm text-red-600">Failed to load products: {error}</p>
					<button
						type="button"
						onClick={() => void load()}
						className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
					>
						Retry
					</button>
				</div>
			) : products.length === 0 ? (
				<div className="mt-6 text-sm text-slate-600">No products found.</div>
			) : (
				<div className="mt-6 overflow-x-auto">
					<table className="w-full border-separate border-spacing-0">
						<thead>
							<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="border-b border-slate-200 pb-3 pr-4">ID</th>
								<th className="border-b border-slate-200 pb-3 pr-4">Article</th>
								<th className="border-b border-slate-200 pb-3 pr-4">Name</th>
								<th className="border-b border-slate-200 pb-3 pr-4">Price</th>
								<th className="border-b border-slate-200 pb-3 text-right">Qty</th>
							</tr>
						</thead>
						<tbody>
							{products.map((p) => (
								<tr key={p.id} className="text-sm text-slate-800">
									<td className="border-b border-slate-100 py-3 pr-4">{p.id}</td>
									<td className="border-b border-slate-100 py-3 pr-4 font-mono text-xs">{p.article}</td>
									<td className="border-b border-slate-100 py-3 pr-4">{p.name}</td>
									<td className="border-b border-slate-100 py-3 pr-4">{(p.priceMinor / 100).toFixed(2)}</td>
									<td className="border-b border-slate-100 py-3 text-right">{p.quantity}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}

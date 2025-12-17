import { useCallback, useEffect, useState } from 'react';

import { getProducts } from '@/entities/product/api/get-products';
import type { Product } from '@/entities/product/model/types';
import { CreateProductForm } from '@/features/product-create';
import { EditProductForm } from '@/features/product-edit';
import { Modal } from '@/shared/ui';

type ProductsPageProps = {
	pageSize?: number;
};

const MAX_PAGE_SIZE = 50;

export function ProductsPage(props: ProductsPageProps) {
	const pageSize = Math.min(props.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);

	const [page, setPage] = useState(1);
	const [reloadToken, setReloadToken] = useState(0);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState(0);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	const load = useCallback(
		async (signal?: AbortSignal) => {
			setIsLoading(true);
			setError(null);

			try {
				const json = await getProducts({ page, limit: pageSize }, signal);
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
		[page, pageSize]
	);

	function onCreated() {
		setPage(1);
		setReloadToken((t) => t + 1);
		setIsCreateOpen(false);
	}

	function onCancelCreate() {
		setIsCreateOpen(false);
	}

	function onUpdated() {
		setReloadToken((t) => t + 1);
		setIsEditOpen(false);
		setEditingProduct(null);
	}

	function onCancelEdit() {
		setIsEditOpen(false);
		setEditingProduct(null);
	}

	useEffect(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	}, [load, reloadToken]);

	return (
		<>
			<div className="mt-8 flex items-center justify-end">
				<button
					type="button"
					onClick={() => setIsCreateOpen(true)}
					className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
				>
					Create product
				</button>
			</div>

			<Modal isOpen={isCreateOpen} title="Create product" onClose={onCancelCreate}>
				<CreateProductForm onCreated={onCreated} onCancel={onCancelCreate} />
			</Modal>

			<Modal isOpen={isEditOpen} title="Edit product" onClose={onCancelEdit}>
				{editingProduct ? (
					<EditProductForm product={editingProduct} onUpdated={onUpdated} onCancel={onCancelEdit} />
				) : null}
			</Modal>
			<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-lg font-semibold">Products</h2>
					<div className="flex items-center gap-3">
						<p className="text-sm text-slate-600">Total: {total}</p>
						<span className="text-slate-300">|</span>
						<p className="text-sm text-slate-600">
							Page {page} of {totalPages}
						</p>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={isLoading || page <= 1}
						className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Prev
					</button>
					<button
						type="button"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={isLoading || page >= totalPages}
						className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Next
					</button>
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
									<th className="border-b border-slate-200 pb-3 text-right">Actions</th>
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
										<td className="border-b border-slate-100 py-3 text-right">
											<button
												type="button"
												onClick={() => {
													setEditingProduct(p);
													setIsEditOpen(true);
												}}
												className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50"
											>
												Edit
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</>
	);
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { getProducts } from '@/entities/product/api/get-products';
import { deleteProduct } from '@/entities/product/api/delete-product';
import type { Product } from '@/entities/product/model/types';
import { CreateProductForm } from '@/features/product-create';
import { EditProductForm } from '@/features/product-edit';
import { ApiError } from '@/shared/api';
import { Modal, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui';

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
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [total, setTotal] = useState(0);
	const hasLoadedOnceRef = useRef(false);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	const load = useCallback(
		async (signal?: AbortSignal) => {
			if (!hasLoadedOnceRef.current) {
				setIsLoading(true);
			} else {
				setIsRefreshing(true);
			}
			setError(null);

			try {
				const json = await getProducts({ page, limit: pageSize }, signal);
				setProducts(json.data);
				setTotal(json.total);
				hasLoadedOnceRef.current = true;
				setHasLoadedOnce(true);
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') {
					return;
				}
				hasLoadedOnceRef.current = true;
				setHasLoadedOnce(true);
				setError(e instanceof Error ? e.message : 'Unknown error');
			} finally {
				setIsLoading(false);
				setIsRefreshing(false);
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

	function onCancelDelete() {
		setIsDeleteOpen(false);
		setDeletingProduct(null);
		setDeleteError(null);
	}

	async function onConfirmDelete() {
		if (!deletingProduct) return;
		const deletingId = deletingProduct.id;
		const prevProducts = products;
		const prevTotal = total;

		setIsDeleting(true);
		setDeleteError(null);
		setProducts((items) => items.filter((p) => p.id !== deletingId));
		setTotal((t) => Math.max(0, t - 1));
		try {
			await deleteProduct(deletingId);
			// Re-fetch current page to fill a potentially missing row and sync totals.
			setReloadToken((t) => t + 1);
			onCancelDelete();
		} catch (e: unknown) {
			setProducts(prevProducts);
			setTotal(prevTotal);
			if (e instanceof ApiError) {
				if (e.status === 404) {
					setDeleteError('Product not found');
					return;
				}
				setDeleteError(e.message);
				return;
			}
			setDeleteError(e instanceof Error ? e.message : 'Unknown error');
		} finally {
			setIsDeleting(false);
		}
	}

	useEffect(() => {
		const controller = new AbortController();
		void load(controller.signal);
		return () => controller.abort();
	}, [load, reloadToken]);

	useEffect(() => {
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, totalPages]);

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

			<Modal isOpen={isDeleteOpen} title="Delete product" onClose={onCancelDelete}>
				{deletingProduct ? (
					<div>
						<p className="text-sm text-slate-700">
							Delete product <span className="font-mono text-xs">{deletingProduct.article}</span> —{' '}
							<span className="font-medium">{deletingProduct.name}</span>?
						</p>
						{deleteError ? <p className="mt-3 text-sm text-red-600">{deleteError}</p> : null}
						<div className="mt-5 flex items-center justify-end gap-2">
							<button
								type="button"
								onClick={onCancelDelete}
								className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void onConfirmDelete()}
								disabled={isDeleting}
								className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isDeleting ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				) : null}
			</Modal>
			<section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex items-center justify-between gap-4">
					<h2 className="text-lg font-semibold">Products</h2>
					<div className="flex items-center gap-3">
						<p className="text-sm text-slate-600">Total: {total}</p>
						<span className="text-slate-300">|</span>
						<p className="w-28 text-right text-sm tabular-nums whitespace-nowrap text-slate-600">
							Page {page} of {totalPages}
						</p>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={isLoading || isRefreshing || page <= 1}
						className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Prev
					</button>
					<button
						type="button"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={isLoading || isRefreshing || page >= totalPages}
						className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Next
					</button>
				</div>

				{error && products.length === 0 ? (
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
				) : null}

				<div className={`mt-6 ${isRefreshing ? 'opacity-70' : ''}`}>
					<Table className="table-fixed border-separate border-spacing-0">
						<colgroup>
							<col className="w-12" />
							<col className="w-40" />
							<col />
							<col className="w-24" />
							<col className="w-20" />
							<col className="w-36" />
						</colgroup>
						<TableHeader className="[&_tr]:border-slate-200">
							<TableRow className="border-slate-200">
								<TableHead className="border-b border-slate-200 pb-3 pr-4 text-left">ID</TableHead>
								<TableHead className="border-b border-slate-200 pb-3 px-4 text-center">Article</TableHead>
								<TableHead className="border-b border-slate-200 pb-3 px-4 text-center">Name</TableHead>
								<TableHead className="border-b border-slate-200 pb-3 pr-4 text-right">Price</TableHead>
								<TableHead className="border-b border-slate-200 pb-3 pr-4 text-right">Qty</TableHead>
								<TableHead className="border-b border-slate-200 pb-3 text-center">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{products.length > 0
								? products.map((p) => (
									<TableRow key={p.id} className="text-sm text-slate-800">
										<TableCell className="border-b border-slate-100 py-3 pr-4 tabular-nums whitespace-nowrap">
											{p.id}
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4 font-mono text-xs">
											<span className="block truncate">{p.article}</span>
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4">
											<span className="block truncate">{p.name}</span>
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4 text-right tabular-nums whitespace-nowrap">
											{(p.priceMinor / 100).toFixed(2)}
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4 text-right tabular-nums whitespace-nowrap">
											{p.quantity}
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 text-right">
											<div className="flex items-center justify-end gap-2 whitespace-nowrap">
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
												<button
													type="button"
													onClick={() => {
														setDeletingProduct(p);
														setIsDeleteOpen(true);
														setDeleteError(null);
													}}
													className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50"
												>
													Delete
												</button>
											</div>
										</TableCell>
									</TableRow>
								))
								: Array.from({ length: 10 }).map((_, i) => (
									<TableRow key={`skeleton-${i}`} className="text-sm text-slate-800">
										<TableCell className="border-b border-slate-100 py-3 pr-4">
											<div className="h-4 w-8 rounded bg-slate-100" />
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4">
											<div className="h-4 w-28 rounded bg-slate-100" />
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4">
											<div className="h-4 w-full rounded bg-slate-100" />
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4">
											<div className="ml-auto h-4 w-16 rounded bg-slate-100" />
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3 pr-4">
											<div className="ml-auto h-4 w-10 rounded bg-slate-100" />
										</TableCell>
										<TableCell className="border-b border-slate-100 py-3">
											<div className="ml-auto h-9 w-28 rounded bg-slate-100" />
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</div>

				{hasLoadedOnce && !error && products.length === 0 ? (
					<div className="mt-3 text-sm text-slate-600">No products found.</div>
				) : null}
			</section>
		</>
	);
}

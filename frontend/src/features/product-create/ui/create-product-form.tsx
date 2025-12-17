import type { FormEvent } from 'react';
import { useState } from 'react';
import { CreateProductDtoSchema } from 'shared';
import { z } from 'zod';

import { createProduct } from '@/entities/product/api/create-product';
import { ApiError } from '@/shared/api';

type FieldErrors = {
	article?: string;
	name?: string;
	price?: string;
	quantity?: string;
};

type CreateProductFormProps = {
	onCreated?: () => void;
	onCancel?: () => void;
};

type ZodTree = {
	properties?: Record<string, { errors?: string[] }>;
};

function inputClass(hasError: boolean) {
	return `h-10 w-full rounded-lg border px-3 text-sm shadow-sm outline-none focus:ring-2 ${hasError
		? 'border-red-300 focus:ring-red-200'
		: 'border-slate-200 focus:ring-slate-200'
		}`;
}

export function CreateProductForm(props: CreateProductFormProps) {
	const [article, setArticle] = useState('');
	const [name, setName] = useState('');
	const [price, setPrice] = useState('');
	const [quantity, setQuantity] = useState('0');

	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();

		setFormError(null);
		setFieldErrors({});

		const priceNumber = Number(price);
		const quantityNumber = Number(quantity);

		const dtoCandidate = {
			article: article.trim(),
			name: name.trim(),
			priceMinor: Math.round(priceNumber * 100),
			quantity: quantityNumber,
		};

		const parsed = CreateProductDtoSchema.safeParse(dtoCandidate);
		if (!parsed.success) {
			const tree = z.treeifyError(parsed.error) as unknown as ZodTree;
			const next: FieldErrors = {};

			const articleError = tree?.properties?.article?.errors?.[0];
			const nameError = tree?.properties?.name?.errors?.[0];
			const priceMinorError = tree?.properties?.priceMinor?.errors?.[0];
			const quantityError = tree?.properties?.quantity?.errors?.[0];

			if (articleError) next.article = articleError;
			if (nameError) next.name = nameError;
			if (priceMinorError) next.price = priceMinorError;
			if (quantityError) next.quantity = quantityError;

			setFieldErrors(next);
			setFormError('Please fix validation errors');
			return;
		}

		setIsSubmitting(true);
		try {
			await createProduct(parsed.data);
			setArticle('');
			setName('');
			setPrice('');
			setQuantity('0');
			props.onCreated?.();
			props.onCancel?.();
		} catch (err: unknown) {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					setFieldErrors({ article: 'Article already exists' });
					return;
				}

				if (err.status === 400) {
					const body = err.body as { errors?: ZodTree } | undefined;
					const tree = body?.errors;
					const next: FieldErrors = {};

					const articleError = tree?.properties?.article?.errors?.[0];
					const nameError = tree?.properties?.name?.errors?.[0];
					const priceMinorError = tree?.properties?.priceMinor?.errors?.[0];
					const quantityError = tree?.properties?.quantity?.errors?.[0];

					if (articleError) next.article = articleError;
					if (nameError) next.name = nameError;
					if (priceMinorError) next.price = priceMinorError;
					if (quantityError) next.quantity = quantityError;

					setFieldErrors(next);
					setFormError(err.message);
					return;
				}

				setFormError(err.message);
				return;
			}

			setFormError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={(e) => void onSubmit(e)}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label className="text-sm font-medium text-slate-700" htmlFor="create-product-article">
						Article
					</label>
					<input
						id="create-product-article"
						name="article"
						className={inputClass(Boolean(fieldErrors.article))}
						value={article}
						onChange={(e) => setArticle(e.target.value)}
						placeholder="A-100"
						autoComplete="off"
					/>
					{fieldErrors.article ? (
						<p className="mt-1 text-xs text-red-600">{fieldErrors.article}</p>
					) : null}
				</div>

				<div>
					<label className="text-sm font-medium text-slate-700" htmlFor="create-product-name">
						Name
					</label>
					<input
						id="create-product-name"
						name="name"
						className={inputClass(Boolean(fieldErrors.name))}
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Product name"
						autoComplete="off"
					/>
					{fieldErrors.name ? (
						<p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
					) : null}
				</div>

				<div>
					<label className="text-sm font-medium text-slate-700" htmlFor="create-product-price">
						Price
					</label>
					<input
						id="create-product-price"
						name="price"
						className={inputClass(Boolean(fieldErrors.price))}
						value={price}
						onChange={(e) => setPrice(e.target.value)}
						placeholder="10.99"
						inputMode="decimal"
					/>
					<p className="mt-1 text-xs text-slate-500">Stored as minor units (×100)</p>
					{fieldErrors.price ? (
						<p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>
					) : null}
				</div>

				<div>
					<label className="text-sm font-medium text-slate-700" htmlFor="create-product-quantity">
						Quantity
					</label>
					<input
						id="create-product-quantity"
						name="quantity"
						className={inputClass(Boolean(fieldErrors.quantity))}
						value={quantity}
						onChange={(e) => setQuantity(e.target.value)}
						placeholder="0"
						inputMode="numeric"
					/>
					{fieldErrors.quantity ? (
						<p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
					) : null}
				</div>
			</div>

			{formError ? <p className="mt-4 text-sm text-red-600">{formError}</p> : null}

			<div className="mt-5 flex items-center justify-end gap-2">
				<button
					type="button"
					onClick={props.onCancel}
					className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? 'Creating...' : 'Create'}
				</button>
			</div>
		</form>
	);
}

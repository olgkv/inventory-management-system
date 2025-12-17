import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreateProductForm } from './create-product-form';

vi.mock('@/entities/product/api/create-product', () => {
	return {
		createProduct: vi.fn(),
		ApiError: class ApiError extends Error {
			status: number;
			body: unknown;

			constructor(status: number) {
				super(`HTTP ${status}`);
				this.status = status;
				this.body = undefined;
			}
		},
	};
});

describe('CreateProductForm', () => {
	it('shows inline validation errors and does not call createProduct on invalid submit', async () => {
		const user = userEvent.setup();

		const api = await import('@/entities/product/api/create-product');

		render(<CreateProductForm />);

		await user.type(screen.getByLabelText('Article'), 'A-1');
		await user.type(screen.getByLabelText('Name'), 'Product');
		await user.type(screen.getByLabelText('Price'), '0');
		await user.clear(screen.getByLabelText('Quantity'));
		await user.type(screen.getByLabelText('Quantity'), '-1');

		await user.click(screen.getByRole('button', { name: 'Create' }));

		expect(await screen.findByText('Must be > 0')).toBeInTheDocument();
		expect(await screen.findByText('Must be ≥ 0')).toBeInTheDocument();

		expect(api.createProduct).not.toHaveBeenCalled();
	});
});

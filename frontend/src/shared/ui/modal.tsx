import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
	isOpen: boolean;
	title: string;
	children: ReactNode;
	onClose: () => void;
};

export function Modal(props: ModalProps) {
	useEffect(() => {
		if (!props.isOpen) return;

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				props.onClose();
			}
		}

		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [props]);

	if (!props.isOpen) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			role="dialog"
			aria-modal="true"
			aria-label={props.title}
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) {
					props.onClose();
				}
			}}
		>
			<div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
				<div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
					<h2 className="text-base font-semibold text-slate-900">{props.title}</h2>
					<button
						type="button"
						onClick={props.onClose}
						className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
						aria-label="Close"
					>
						×
					</button>
				</div>
				<div className="px-6 py-5">{props.children}</div>
			</div>
		</div>,
		document.body
	);
}

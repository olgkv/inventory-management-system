import * as React from 'react';

function cn(...inputs: Array<string | false | null | undefined>) {
	return inputs.filter(Boolean).join(' ');
}

type TableProps = React.HTMLAttributes<HTMLTableElement>;

type TableSectionProps = React.HTMLAttributes<HTMLTableSectionElement>;

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => (
	<div className="relative w-full overflow-auto">
		<table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
	</div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(({ className, ...props }, ref) => (
	<thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(({ className, ...props }, ref) => (
	<tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(({ className, ...props }, ref) => (
	<tfoot ref={ref} className={cn('border-t bg-slate-50 font-medium [&>tr]:last:border-b-0', className)} {...props} />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn('border-b border-slate-100 transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50', className)}
		{...props}
	/>
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn('h-12 px-4 align-middle text-xs font-semibold uppercase tracking-wide text-slate-500 [&:has([role=checkbox])]:pr-0', className)}
		{...props}
	/>
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, ...props }, ref) => (
	<td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(({ className, ...props }, ref) => (
	<caption ref={ref} className={cn('mt-4 text-sm text-slate-500', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };

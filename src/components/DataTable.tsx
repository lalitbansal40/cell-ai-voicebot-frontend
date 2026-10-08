import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';

import { getErrorMessage } from '@/services/api/errors';

import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Offset pagination (1-based page). */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
  };
  footer?: ReactNode;
  'aria-label'?: string;
}

/** Table with loading skeleton, empty state, error + retry, and pagination. */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  pagination,
  footer,
  'aria-label': ariaLabel,
}: DataTableProps<T>) {
  return (
    <Paper variant="outlined">
      {Boolean(error) && (
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            )
          }
          sx={{ borderRadius: 0 }}
        >
          {getErrorMessage(error)}
        </Alert>
      )}
      <TableContainer>
        <Table size="small" aria-label={ariaLabel} aria-busy={loading ? 'true' : undefined}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width, fontWeight: 600 }}>
                  {c.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={`s${i}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading &&
              rows?.map((row) => (
                <TableRow key={getRowId(row)} hover>
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && !error && rows?.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={Math.max(0, pagination.page - 1)}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={pagination.onLimitChange ? [10, 20, 50, 100] : [pagination.limit]}
          onPageChange={(_e, p) => pagination.onPageChange(p + 1)}
          onRowsPerPageChange={(e) => pagination.onLimitChange?.(Number(e.target.value))}
        />
      )}
      {footer}
    </Paper>
  );
}

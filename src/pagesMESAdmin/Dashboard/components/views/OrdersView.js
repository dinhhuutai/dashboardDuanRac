import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';
import Pagination from '../Pagination';
import { formatDate, formatDateTime } from '../../utils/dashboardHelpers';

function OrdersView({ rows, onRowClick, pagination, onPageChange }) {
  return (
    <>
      <DataTable
        columns={[
          { key: 'OrderID', title: 'ID đơn hàng' },
          { key: 'CustomerName', title: 'Khách hàng' },
          { key: 'PO', title: 'Đơn hàng' },
          {
            key: 'Deadline',
            title: 'Deadline',
            render: (row) => formatDate(row.Deadline),
          },
          {
            key: 'MStatus',
            title: 'Tình trạng',
            render: (row) => <StatusBadge value={row.MStatus} />,
          },
          {
            key: 'CreatedAt',
            title: 'Ngày tạo',
            render: (row) => formatDateTime(row.CreatedAt),
          },
        ]}
        rows={rows}
        rowKey="OrderID"
        emptyText="Không có đơn hàng"
        onRowClick={onRowClick}
        mobileTitle={(row) => `Đơn hàng #${row.OrderID}`}
        mobileSubtitle={(row) => row.CustomerName || ''}
      />

      <Pagination
        page={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default OrdersView;
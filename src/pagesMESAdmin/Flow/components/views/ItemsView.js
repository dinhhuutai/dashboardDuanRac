import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';
import Pagination from '../Pagination';
import { formatDateTime } from '../../utils/dashboardHelpers';

function ItemsView({ rows, onRowClick, pagination, onPageChange, loading }) {
  return (
    <>
      <DataTable
        columns={[
          { key: 'ItemID', title: 'ID mã hàng' },
          { key: 'PO', title: 'Đơn hàng' },
          { key: 'ItemCode', title: 'Mã hàng' },
          { key: 'Quantity', title: 'Số lượng' },
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
        rowKey={(row, index) => `${row.ItemID}-${row.OrderID}-${index}`}
        emptyText="Không có mã hàng"
        onRowClick={onRowClick}
        mobileTitle={(row) => row.ItemCode || `Item #${row.ItemID}`}
        mobileSubtitle={(row) => `OrderID: ${row.OrderID}`}
      />

      <Pagination
        page={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        onPageChange={onPageChange}
        disabled={loading}
      />
    </>
  );
}

export default ItemsView;
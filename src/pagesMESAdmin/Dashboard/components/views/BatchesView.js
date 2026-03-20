import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';
import Pagination from '../Pagination';
import { formatDateTime, safeValue } from '../../utils/dashboardHelpers';

function BatchesView({ rows, pagination, onPageChange, loading }) {
  return (
    <>
      <DataTable
        headerGroups={[
          { title: '5. Vải về', colSpan: 5 },
          { title: '6. Soạn 4M - Khuôn', colSpan: 2 },
          { title: '7. Soạn 4M - Mực', colSpan: 2 },
          { title: '8. Lập kế hoạch', colSpan: 2 },
          { title: '9. In', colSpan: 2 },
          { title: '10. Chờ khô', colSpan: 3 },
          { title: '11. KCS', colSpan: 1, mergeSingle: false },
          { title: '12. Sửa', colSpan: 2 },
          { title: '13. OQC', colSpan: 1, mergeSingle: false },
          { title: '14. Giao hàng', colSpan: 2 },
        ]}
        columns={[
          { key: 'BatchID', title: 'Mã lần vải về' },
          {
            key: 'ReceivedDate',
            title: 'Ngày nhận',
            render: (row) => formatDateTime(row.ReceivedDate),
          },
          { key: 'QuantityReceived', title: 'SL nhận' },
          {
            key: 'FabricStatus',
            title: 'Tình trạng vải',
            render: (row) => <StatusBadge value={row.FabricStatus} />,
          },
          {
            key: 'DeliveryDeadline',
            title: 'Hạn giao',
            render: (row) => formatDateTime(row.DeliveryDeadline),
          },

          {
            key: 'KhuonReceiveTime',
            title: 'Ngày giờ nhận',
            render: (row) => formatDateTime(row.KhuonReceiveTime),
          },
          {
            key: 'KhuonReturnTime',
            title: 'Ngày giờ trả',
            render: (row) => formatDateTime(row.KhuonReturnTime),
          },

          {
            key: 'MucReceiveTime',
            title: 'Ngày giờ nhận',
            render: (row) => formatDateTime(row.MucReceiveTime),
          },
          {
            key: 'MucReturnTime',
            title: 'Ngày giờ trả',
            render: (row) => formatDateTime(row.MucReturnTime),
          },

          {
            key: 'PlanTime',
            title: 'Giờ lập kế hoạch',
            render: (row) => formatDateTime(row.PlanTime),
          },
          {
            key: 'HasPlan',
            title: 'Có / Chưa có',
            render: (row) => <StatusBadge value={row.HasPlan} />,
          },

          {
            key: 'PrintTime',
            title: 'Giờ in',
            render: (row) => formatDateTime(row.PrintTime),
          },
          { key: 'PrintedQuantity', title: 'Số lượng đã in' },

          {
            key: 'DryingDuration',
            title: 'Thời gian chờ khô',
            render: (row) => safeValue(row.DryingDuration),
          },
          {
            key: 'DryingStartTime',
            title: 'Thời gian bắt đầu phơi',
            render: (row) => formatDateTime(row.DryingStartTime),
          },
          { key: 'QtyOnTrolley', title: 'Số lượng tồn trên xe' },

          {
            key: 'KCSResult',
            title: 'Đạt / Không đạt',
            render: (row) => <StatusBadge value={row.KCSResult} />,
          },

          { key: 'RepairQuantity', title: 'Số lượng sửa' },
          { key: 'ScrapQuantity', title: 'Số lượng in hư hủy' },

          {
            key: 'OQCResult',
            title: 'Đạt / Không đạt',
            render: (row) => <StatusBadge value={row.OQCResult} />,
          },

          {
            key: 'DeliveryTime',
            title: 'Thời gian giao hàng',
            render: (row) => formatDateTime(row.DeliveryTime),
          },
          { key: 'PackingQuantity', title: 'Số lượng packing' },
        ]}
        rows={rows}
        rowKey={(row, index) => `${row.BatchID}-${row.DetailID || 'detail'}-${index}`}
        emptyText="Không có lần vải về"
        mobileTitle={(row) => `Lần vải về ${row.BatchID}`}
        mobileSubtitle={(row) =>
          `Ngày nhận: ${formatDateTime(row.ReceivedDate)} | SL nhận: ${row.QuantityReceived || '-'}`
        }
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

export default BatchesView;
import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';
import Pagination from '../Pagination';
import { formatDateTime } from '../../utils/dashboardHelpers';

function DetailsView({ rows, onRowClick, pagination, onPageChange }) {
  
  console.log(rows)
    return (
    <>
      <DataTable
        headerGroups={[
          { title: '1. Thông tin đơn hàng', colSpan: 11 },
          { title: '2. Hồ sơ kỹ thuật', colSpan: 1 },
          { title: '3. Khuôn in', colSpan: 1 },
          { title: '4. Mực in', colSpan: 1 },
          { title: '5. Vải về', colSpan: 1 },
          { title: '6. 4M - Khuôn', colSpan: 1 },
          { title: '7. 4M - Mực', colSpan: 1 },
          { title: '8. Lập kế hoạch', colSpan: 1 },
          { title: '9. In', colSpan: 1 },
          { title: '10. Chờ khô', colSpan: 1 },
          { title: '11. KCS', colSpan: 1 },
          { title: '12. Sửa', colSpan: 1 },
          { title: '13. OQC', colSpan: 1 },
          { title: '14. Giao hàng', colSpan: 1 },
        ]}
        columns={[
          { key: 'DetailID', title: 'ID chi tiết' },
          { key: 'PO', title: 'Đơn hàng' },
          { key: 'hanghoaten', title: 'Mã hàng' },
          { key: 'MauVai', title: 'Màu vải' },
          { key: 'KichVai', title: 'Kích vải' },
          { key: 'KichPhim', title: 'Kích phim' },
          { key: 'Mauin', title: 'Màu in' },
          { key: 'Quantity', title: 'Số lượng' },
          { key: 'DeliveryDeadline', title: 'Hạn giao' },
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

          {
            key: 'HoSoKyThuat',
            title: 'Hồ sơ kỹ thuật',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.HoSoKyThuat} />,
          },
          {
            key: 'KhuonIn',
            title: 'Khuôn in',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.KhuonIn} />,
          },
          {
            key: 'MucIn',
            title: 'Mực in',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.MucIn} />,
          },
          {
            key: 'VaiVe',
            title: 'Vải về',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.VaiVe} />,
          },
          {
            key: 'Khuon4M',
            title: '4M - Khuôn',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.Khuon4M} />,
          },
          {
            key: 'Muc4M',
            title: '4M - Mực',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.Muc4M} />,
          },
          {
            key: 'LapKeHoach',
            title: 'Lập kế hoạch',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.LapKeHoach} />,
          },
          {
            key: 'InCongDoan',
            title: 'In',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.InCongDoan} />,
          },
          {
            key: 'ChoKho',
            title: 'Chờ khô',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.ChoKho} />,
          },
          {
            key: 'KCS',
            title: 'KCS',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.KCS} />,
          },
          {
            key: 'Sua',
            title: 'Sửa',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.Sua} />,
          },
          {
            key: 'OQC',
            title: 'OQC',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.OQC} />,
          },
          {
            key: 'GiaoHang',
            title: 'Giao hàng',
            hideSubHeader: true,
            render: (row) => <StatusBadge value={row.GiaoHang} />,
          },
        ]}
        rows={rows}
        rowKey="DetailID"
        emptyText="Không có chi tiết"
        onRowClick={onRowClick}
        mobileTitle={(row) => row.DetailCode || `Detail #${row.DetailID}`}
        mobileSubtitle={(row) =>
          `Đơn hàng: ${row.PO || '-'} | Mã hàng: ${row.hanghoaten || '-'}`
        }
      />

      <Pagination
        page={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default DetailsView;
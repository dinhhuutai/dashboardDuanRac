// import { useEffect, useMemo, useRef, useState } from 'react';
// import {
//   apiGetOrders,
//   apiGetItemsByOrder,
//   apiGetDetailsByItem,
//   apiGetBatchesByDetail,
// } from './services/dashboardApi';

// import DashboardFilters from './components/DashboardFilters';
// import OrdersView from './components/views/OrdersView';
// import ItemsView from './components/views/ItemsView';
// import DetailsView from './components/views/DetailsView';
// import BatchesView from './components/views/BatchesView';

// function Dashboard() {
//   const [level, setLevel] = useState('orders'); // orders | items | details | batches

//   const [orders, setOrders] = useState([]);
//   const [items, setItems] = useState([]);
//   const [details, setDetails] = useState([]);
//   const [batches, setBatches] = useState([]);

//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [selectedDetail, setSelectedDetail] = useState(null);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const DEFAULT_STATUS = '01_OPEN';
//   const DEFAULT_PAGE_SIZE = 5;
//   const FILTER_DEBOUNCE = 400;

//   const [orderFilters, setOrderFilters] = useState({
//     range: { from: undefined, to: undefined },
//     po: '',
//     customerName: '',
//     mstatus: DEFAULT_STATUS,
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//   });

//   const [itemFilters, setItemFilters] = useState({
//     range: { from: undefined, to: undefined },
//     id: '',
//     mstatus: '',
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//   });

//   const [detailFilters, setDetailFilters] = useState({
//     range: { from: undefined, to: undefined },
//     mstatus: '',
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//   });

//   const [batchFilters, setBatchFilters] = useState({
//     range: { from: undefined, to: undefined },
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//   });

//   const [ordersPagination, setOrdersPagination] = useState({
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//     total: 0,
//     totalPages: 0,
//   });

//   const [itemsPagination, setItemsPagination] = useState({
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//     total: 0,
//     totalPages: 0,
//   });

//   const [detailsPagination, setDetailsPagination] = useState({
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//     total: 0,
//     totalPages: 0,
//   });

//   const [batchesPagination, setBatchesPagination] = useState({
//     page: 1,
//     pageSize: DEFAULT_PAGE_SIZE,
//     total: 0,
//     totalPages: 0,
//   });

//   const mountedRef = useRef(false);

//   async function loadOrders(customFilters) {
//     try {
//       setLoading(true);
//       setError('');
//       const filters = customFilters || orderFilters;
//       const result = await apiGetOrders(filters);

//       setOrders(result?.data || []);
//       setOrdersPagination(
//         result?.pagination || {
//           page: 1,
//           pageSize: DEFAULT_PAGE_SIZE,
//           total: 0,
//           totalPages: 0,
//         }
//       );
//     } catch (err) {
//       console.error(err);
//       setOrders([]);
//       setOrdersPagination({
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//         total: 0,
//         totalPages: 0,
//       });
//       setError('Không tải được danh sách đơn hàng');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadItems(orderId, customFilters) {
//     try {
//       setLoading(true);
//       setError('');
//       const filters = customFilters || itemFilters;
//       const result = await apiGetItemsByOrder(orderId, filters);

//       setItems(result?.data || []);
//       setItemsPagination(
//         result?.pagination || {
//           page: 1,
//           pageSize: DEFAULT_PAGE_SIZE,
//           total: 0,
//           totalPages: 0,
//         }
//       );
//     } catch (err) {
//       console.error(err);
//       setItems([]);
//       setItemsPagination({
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//         total: 0,
//         totalPages: 0,
//       });
//       setError('Không tải được danh sách mã hàng');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadDetails(itemId, customFilters) {
//     try {
//       setLoading(true);
//       setError('');
//       const filters = customFilters || detailFilters;
//       const result = await apiGetDetailsByItem(itemId, filters);

//       setDetails(result?.data || []);
//       setDetailsPagination(
//         result?.pagination || {
//           page: 1,
//           pageSize: DEFAULT_PAGE_SIZE,
//           total: 0,
//           totalPages: 0,
//         }
//       );
//     } catch (err) {
//       console.error(err);
//       setDetails([]);
//       setDetailsPagination({
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//         total: 0,
//         totalPages: 0,
//       });
//       setError('Không tải được danh sách chi tiết');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function loadBatches(detailId, customFilters) {
//     try {
//       setLoading(true);
//       setError('');
//       const filters = customFilters || batchFilters;
//       const result = await apiGetBatchesByDetail(detailId, filters);

//       setBatches(result?.data || []);
//       setBatchesPagination(
//         result?.pagination || {
//           page: 1,
//           pageSize: DEFAULT_PAGE_SIZE,
//           total: 0,
//           totalPages: 0,
//         }
//       );
//     } catch (err) {
//       console.error(err);
//       setBatches([]);
//       setBatchesPagination({
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//         total: 0,
//         totalPages: 0,
//       });
//       setError('Không tải được danh sách lần vải về');
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//     };
//   }, []);

//   // orders: page đổi thì load ngay
//   useEffect(() => {
//     if (!mountedRef.current || level !== 'orders') return;
//     loadOrders(orderFilters);
//   }, [level, orderFilters.page, orderFilters.pageSize]);

//   // orders: filter đổi thì debounce
//   useEffect(() => {
//     if (!mountedRef.current || level !== 'orders') return;

//     const timer = setTimeout(() => {
//       loadOrders(orderFilters);
//     }, FILTER_DEBOUNCE);

//     return () => clearTimeout(timer);
//   }, [
//     level,
//     orderFilters.po,
//     orderFilters.customerName,
//     orderFilters.mstatus,
//     orderFilters.range?.from,
//     orderFilters.range?.to,
//   ]);

//   // items: page/pageSize đổi thì load ngay
//   useEffect(() => {
//     if (level !== 'items' || !selectedOrder?.OrderID) return;
//     loadItems(selectedOrder.OrderID, itemFilters);
//   }, [level, selectedOrder?.OrderID, itemFilters.page, itemFilters.pageSize]);

//   // items: filter đổi thì debounce
//   useEffect(() => {
//     if (level !== 'items' || !selectedOrder?.OrderID) return;

//     const timer = setTimeout(() => {
//       loadItems(selectedOrder.OrderID, itemFilters);
//     }, FILTER_DEBOUNCE);

//     return () => clearTimeout(timer);
//   }, [
//     level,
//     selectedOrder?.OrderID,
//     itemFilters.id,
//     itemFilters.mstatus,
//     itemFilters.range?.from,
//     itemFilters.range?.to,
//   ]);

//   // details: page đổi thì load ngay
//   useEffect(() => {
//     if (level !== 'details' || !selectedItem?.ItemID) return;
//     loadDetails(selectedItem.ItemID, detailFilters);
//   }, [level, selectedItem?.ItemID, detailFilters.page, detailFilters.pageSize]);

//   // details: filter đổi thì debounce
//   useEffect(() => {
//     if (level !== 'details' || !selectedItem?.ItemID) return;

//     const timer = setTimeout(() => {
//       loadDetails(selectedItem.ItemID, detailFilters);
//     }, FILTER_DEBOUNCE);

//     return () => clearTimeout(timer);
//   }, [
//     level,
//     selectedItem?.ItemID,
//     detailFilters.mstatus,
//     detailFilters.range?.from,
//     detailFilters.range?.to,
//   ]);

//   // batches: page đổi thì load ngay
//   useEffect(() => {
//     if (level !== 'batches' || !selectedDetail?.DetailID) return;
//     loadBatches(selectedDetail.DetailID, batchFilters);
//   }, [level, selectedDetail?.DetailID, batchFilters.page, batchFilters.pageSize]);

//   // batches: filter đổi thì debounce
//   useEffect(() => {
//     if (level !== 'batches' || !selectedDetail?.DetailID) return;

//     const timer = setTimeout(() => {
//       loadBatches(selectedDetail.DetailID, batchFilters);
//     }, FILTER_DEBOUNCE);

//     return () => clearTimeout(timer);
//   }, [
//     level,
//     selectedDetail?.DetailID,
//     batchFilters.range?.from,
//     batchFilters.range?.to,
//   ]);

//   function handleSelectOrder(order) {
//     setSelectedOrder(order);
//     setSelectedItem(null);
//     setSelectedDetail(null);

//     setItems([]);
//     setDetails([]);
//     setBatches([]);

//     setItemsPagination({
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     setDetailsPagination({
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     setBatchesPagination({
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     setItemFilters({
//       range: { from: undefined, to: undefined },
//       id: '',
//       mstatus: '',
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//     });

//     setDetailFilters({
//       range: { from: undefined, to: undefined },
//       mstatus: '',
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//     });

//     setBatchFilters({
//       range: { from: undefined, to: undefined },
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//     });

//     setLevel('items');
//   }

//   function handleSelectItem(item) {
//     setSelectedItem(item);
//     setSelectedDetail(null);

//     setDetails([]);
//     setBatches([]);

//     setDetailsPagination({
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     setBatchesPagination({
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     setDetailFilters({
//       range: { from: undefined, to: undefined },
//       mstatus: '',
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//     });

//     setBatchFilters({
//       range: { from: undefined, to: undefined },
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//     });

//     setLevel('details');
//   }

//   function handleSelectDetail(detail) {
//     setSelectedDetail(detail);
//     setBatches([]);

//     setBatchesPagination({
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//       total: 0,
//       totalPages: 0,
//     });

//     setBatchFilters({
//       range: { from: undefined, to: undefined },
//       page: 1,
//       pageSize: DEFAULT_PAGE_SIZE,
//     });

//     setLevel('batches');
//   }

//   function handleBack() {
//     setError('');

//     if (level === 'batches') {
//       setLevel('details');
//       return;
//     }

//     if (level === 'details') {
//       setLevel('items');
//       return;
//     }

//     if (level === 'items') {
//       setLevel('orders');
//     }
//   }

//   function handleReset() {
//     if (level === 'orders') {
//       setOrderFilters({
//         range: { from: undefined, to: undefined },
//         po: '',
//         customerName: '',
//         mstatus: DEFAULT_STATUS,
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//       });
//       return;
//     }

//     if (level === 'items') {
//       setItemFilters({
//         range: { from: undefined, to: undefined },
//         id: '',
//         mstatus: '',
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//       });
//       return;
//     }

//     if (level === 'details') {
//       setDetailFilters({
//         range: { from: undefined, to: undefined },
//         mstatus: '',
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//       });
//       return;
//     }

//     if (level === 'batches') {
//       setBatchFilters({
//         range: { from: undefined, to: undefined },
//         page: 1,
//         pageSize: DEFAULT_PAGE_SIZE,
//       });
//     }
//   }

//   const pageTitle = useMemo(() => {
//     if (level === 'orders') return 'Danh sách đơn hàng';
//     if (level === 'items') {
//       return `Danh sách mã hàng - Đơn hàng ${selectedOrder?.PO ?? ''}`;
//     }
//     if (level === 'details') {
//       return `Danh sách chi tiết - Mã hàng ${selectedItem?.ItemCode ?? ''}`;
//     }
//     return `Danh sách Lần vải về - Chi tiết ${selectedDetail?.DetailID ?? ''}`;
//   }, [level, selectedOrder, selectedItem, selectedDetail]);

//   const breadcrumb = useMemo(() => {
//     const list = [`Đơn hàng ${selectedOrder ? `(${selectedOrder?.PO})` : ''}`];
//     if (selectedOrder) {
//       list.push(`Mã hàng ${selectedItem ? `(${selectedItem?.ItemCode})` : ''}`);
//     }
//     if (selectedItem) {
//       list.push(`Chi tiết ${selectedDetail ? `(${selectedDetail?.DetailID})` : ''}`);
//     }
//     if (selectedDetail) {
//       list.push('Lần vải về');
//     }
//     return list.join(' > ');
//   }, [selectedOrder, selectedItem, selectedDetail]);

//   const currentFilters =
//     level === 'orders'
//       ? orderFilters
//       : level === 'items'
//       ? itemFilters
//       : level === 'details'
//       ? detailFilters
//       : batchFilters;

//   const setCurrentFilters =
//     level === 'orders'
//       ? setOrderFilters
//       : level === 'items'
//       ? setItemFilters
//       : level === 'details'
//       ? setDetailFilters
//       : setBatchFilters;

//   return (
//     <div className="min-h-screen bg-slate-100 p-3 md:p-4">
//       <div className="mb-4">
//         <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
//           Dòng chảy đơn hàng
//         </h1>

//         <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 md:text-sm">
//           {breadcrumb}
//         </div>
//       </div>

//       <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//         <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//           <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
//             {pageTitle}
//           </h2>

//           {level !== 'orders' && (
//             <button
//               type="button"
//               onClick={handleBack}
//               className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
//             >
//               ← Quay lại
//             </button>
//           )}
//         </div>

//         <DashboardFilters
//           level={level}
//           currentFilters={currentFilters}
//           setCurrentFilters={setCurrentFilters}
//           orderFilters={orderFilters}
//           setOrderFilters={setOrderFilters}
//           onReset={handleReset}
//         />

//         <div className="relative">
//           {error ? (
//             <div className="mb-4 flex min-h-[100px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-center text-red-700">
//               {error}
//             </div>
//           ) : (
//             <>
//               {level === 'orders' && (
//                 <OrdersView
//                   rows={orders}
//                   onRowClick={handleSelectOrder}
//                   pagination={ordersPagination}
//                   onPageChange={(page) =>
//                     setOrderFilters((prev) => ({ ...prev, page }))
//                   }
//                   loading={loading}
//                 />
//               )}

//               {level === 'items' && (
//                 <ItemsView
//                   rows={items}
//                   onRowClick={handleSelectItem}
//                   pagination={itemsPagination}
//                   onPageChange={(page) =>
//                     setItemFilters((prev) => ({ ...prev, page }))
//                   }
//                   loading={loading}
//                 />
//               )}

//               {level === 'details' && (
//                 <DetailsView
//                   rows={details}
//                   onRowClick={handleSelectDetail}
//                   pagination={detailsPagination}
//                   onPageChange={(page) =>
//                     setDetailFilters((prev) => ({ ...prev, page }))
//                   }
//                   loading={loading}
//                 />
//               )}

//               {level === 'batches' && (
//                 <BatchesView
//                   rows={batches}
//                   pagination={batchesPagination}
//                   onPageChange={(page) =>
//                     setBatchFilters((prev) => ({ ...prev, page }))
//                   }
//                   loading={loading}
//                 />
//               )}
//             </>
//           )}

//           {loading && (
//             <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px]">
//               <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
//                 Đang tải dữ liệu...
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;



import { useEffect, useMemo, useRef, useState } from 'react';
import {
  apiGetOrders,
  apiGetItemsByOrder,
  apiGetDetailsByItem,
  apiGetBatchesByDetail,
} from './services/dashboardApi';

import DashboardFilters from './components/DashboardFilters';
import OrdersView from './components/views/OrdersView';
import ItemsView from './components/views/ItemsView';
import DetailsView from './components/views/DetailsView';
import BatchesView from './components/views/BatchesView';

function Dashboard() {
  const [level, setLevel] = useState('orders'); // orders | items | details | batches

  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [details, setDetails] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState('');

  const DEFAULT_STATUS = '01_OPEN';
  const DEFAULT_PAGE_SIZE = 5;
  const FILTER_DEBOUNCE = 400;
  const LOADING_DELAY = 180;

  const [orderFilters, setOrderFilters] = useState({
    range: { from: undefined, to: undefined },
    po: '',
    customerName: '',
    mstatus: DEFAULT_STATUS,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [itemFilters, setItemFilters] = useState({
    range: { from: undefined, to: undefined },
    id: '',
    mstatus: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [detailFilters, setDetailFilters] = useState({
    range: { from: undefined, to: undefined },
    mstatus: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [batchFilters, setBatchFilters] = useState({
    range: { from: undefined, to: undefined },
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [itemsPagination, setItemsPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [detailsPagination, setDetailsPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [batchesPagination, setBatchesPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const mountedRef = useRef(false);

  function startLoading() {
    setLoadingCount((prev) => prev + 1);
  }

  function stopLoading() {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }

  useEffect(() => {
    let timer;

    if (loading) {
      timer = setTimeout(() => {
        setShowLoading(true);
      }, LOADING_DELAY);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  async function loadOrders(customFilters) {
    try {
      startLoading();
      setError('');
      const filters = customFilters || orderFilters;
      const result = await apiGetOrders(filters);

      setOrders(result?.data || []);
      setOrdersPagination(
        result?.pagination || {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error(err);
      setOrders([]);
      setOrdersPagination({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setError('Không tải được danh sách đơn hàng');
    } finally {
      stopLoading();
    }
  }

  async function loadItems(orderId, customFilters) {
    try {
      startLoading();
      setError('');
      const filters = customFilters || itemFilters;
      const result = await apiGetItemsByOrder(orderId, filters);

      setItems(result?.data || []);
      setItemsPagination(
        result?.pagination || {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error(err);
      setItems([]);
      setItemsPagination({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setError('Không tải được danh sách mã hàng');
    } finally {
      stopLoading();
    }
  }

  async function loadDetails(itemId, customFilters) {
    try {
      startLoading();
      setError('');
      const filters = customFilters || detailFilters;
      const result = await apiGetDetailsByItem(itemId, filters);

      setDetails(result?.data || []);
      setDetailsPagination(
        result?.pagination || {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error(err);
      setDetails([]);
      setDetailsPagination({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setError('Không tải được danh sách chi tiết');
    } finally {
      stopLoading();
    }
  }

  async function loadBatches(detailId, customFilters) {
    try {
      startLoading();
      setError('');
      const filters = customFilters || batchFilters;
      const result = await apiGetBatchesByDetail(detailId, filters);

      setBatches(result?.data || []);
      setBatchesPagination(
        result?.pagination || {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      console.error(err);
      setBatches([]);
      setBatchesPagination({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setError('Không tải được danh sách lần vải về');
    } finally {
      stopLoading();
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // orders: vào level / đổi page / pageSize thì load ngay
  useEffect(() => {
    if (!mountedRef.current || level !== 'orders') return;
    loadOrders(orderFilters);
  }, [level, orderFilters.page, orderFilters.pageSize]);

  // orders: chỉ debounce khi filter đổi
  useEffect(() => {
    if (!mountedRef.current || level !== 'orders') return;

    const timer = setTimeout(() => {
      loadOrders(orderFilters);
    }, FILTER_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [
    orderFilters.po,
    orderFilters.customerName,
    orderFilters.mstatus,
    orderFilters.range?.from,
    orderFilters.range?.to,
  ]);

  // items: vào level / đổi page / pageSize thì load ngay
  useEffect(() => {
    if (level !== 'items' || !selectedOrder?.OrderID) return;
    loadItems(selectedOrder.OrderID, itemFilters);
  }, [level, selectedOrder?.OrderID, itemFilters.page, itemFilters.pageSize]);

  // items: chỉ debounce khi filter đổi
  useEffect(() => {
    if (level !== 'items' || !selectedOrder?.OrderID) return;

    const timer = setTimeout(() => {
      loadItems(selectedOrder.OrderID, itemFilters);
    }, FILTER_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [
    itemFilters.id,
    itemFilters.mstatus,
    itemFilters.range?.from,
    itemFilters.range?.to,
  ]);

  // details: vào level / đổi page / pageSize thì load ngay
  useEffect(() => {
    if (level !== 'details' || !selectedItem?.ItemID) return;
    loadDetails(selectedItem.ItemID, detailFilters);
  }, [level, selectedItem?.ItemID, detailFilters.page, detailFilters.pageSize]);

  // details: chỉ debounce khi filter đổi
  useEffect(() => {
    if (level !== 'details' || !selectedItem?.ItemID) return;

    const timer = setTimeout(() => {
      loadDetails(selectedItem.ItemID, detailFilters);
    }, FILTER_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [
    detailFilters.mstatus,
    detailFilters.range?.from,
    detailFilters.range?.to,
  ]);

  // batches: vào level / đổi page / pageSize thì load ngay
  useEffect(() => {
    if (level !== 'batches' || !selectedDetail?.DetailID) return;
    loadBatches(selectedDetail.DetailID, batchFilters);
  }, [level, selectedDetail?.DetailID, batchFilters.page, batchFilters.pageSize]);

  // batches: chỉ debounce khi filter đổi
  useEffect(() => {
    if (level !== 'batches' || !selectedDetail?.DetailID) return;

    const timer = setTimeout(() => {
      loadBatches(selectedDetail.DetailID, batchFilters);
    }, FILTER_DEBOUNCE);

    return () => clearTimeout(timer);
  }, [batchFilters.range?.from, batchFilters.range?.to]);

  function handleSelectOrder(order) {
    setError('');
    setSelectedOrder(order);
    setSelectedItem(null);
    setSelectedDetail(null);

    setItems([]);
    setDetails([]);
    setBatches([]);

    setItemsPagination({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    setDetailsPagination({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    setBatchesPagination({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    setItemFilters({
      range: { from: undefined, to: undefined },
      id: '',
      mstatus: '',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    setDetailFilters({
      range: { from: undefined, to: undefined },
      mstatus: '',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    setBatchFilters({
      range: { from: undefined, to: undefined },
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    setLevel('items');
  }

  function handleSelectItem(item) {
    setError('');
    setSelectedItem(item);
    setSelectedDetail(null);

    setDetails([]);
    setBatches([]);

    setDetailsPagination({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    setBatchesPagination({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    setDetailFilters({
      range: { from: undefined, to: undefined },
      mstatus: '',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    setBatchFilters({
      range: { from: undefined, to: undefined },
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    setLevel('details');
  }

  function handleSelectDetail(detail) {
    setError('');
    setSelectedDetail(detail);
    setBatches([]);

    setBatchesPagination({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });

    setBatchFilters({
      range: { from: undefined, to: undefined },
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });

    setLevel('batches');
  }

  function handleBack() {
    setError('');

    if (level === 'batches') {
      setLevel('details');
      return;
    }

    if (level === 'details') {
      setLevel('items');
      return;
    }

    if (level === 'items') {
      setLevel('orders');
    }
  }

  function handleReset() {
    setError('');

    if (level === 'orders') {
      setOrderFilters({
        range: { from: undefined, to: undefined },
        po: '',
        customerName: '',
        mstatus: DEFAULT_STATUS,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      return;
    }

    if (level === 'items') {
      setItemFilters({
        range: { from: undefined, to: undefined },
        id: '',
        mstatus: '',
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      return;
    }

    if (level === 'details') {
      setDetailFilters({
        range: { from: undefined, to: undefined },
        mstatus: '',
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      return;
    }

    if (level === 'batches') {
      setBatchFilters({
        range: { from: undefined, to: undefined },
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    }
  }

  const pageTitle = useMemo(() => {
    if (level === 'orders') return 'Danh sách đơn hàng';
    if (level === 'items') {
      return `Danh sách mã hàng - Đơn hàng ${selectedOrder?.PO ?? ''}`;
    }
    if (level === 'details') {
      return `Danh sách chi tiết - Mã hàng ${selectedItem?.ItemCode ?? ''}`;
    }
    return `Danh sách Lần vải về - Chi tiết ${selectedDetail?.DetailID ?? ''}`;
  }, [level, selectedOrder, selectedItem, selectedDetail]);

  const breadcrumb = useMemo(() => {
    const list = [`Đơn hàng ${selectedOrder ? `(${selectedOrder?.PO})` : ''}`];
    if (selectedOrder) {
      list.push(`Mã hàng ${selectedItem ? `(${selectedItem?.ItemCode})` : ''}`);
    }
    if (selectedItem) {
      list.push(`Chi tiết ${selectedDetail ? `(${selectedDetail?.DetailID})` : ''}`);
    }
    if (selectedDetail) {
      list.push('Lần vải về');
    }
    return list.join(' > ');
  }, [selectedOrder, selectedItem, selectedDetail]);

  const currentFilters =
    level === 'orders'
      ? orderFilters
      : level === 'items'
      ? itemFilters
      : level === 'details'
      ? detailFilters
      : batchFilters;

  const setCurrentFilters =
    level === 'orders'
      ? setOrderFilters
      : level === 'items'
      ? setItemFilters
      : level === 'details'
      ? setDetailFilters
      : setBatchFilters;

  return (
    <div className="min-h-screen bg-slate-100 p-3 md:p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Dòng chảy đơn hàng
        </h1>

        <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 md:text-sm">
          {breadcrumb}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">
            {pageTitle}
          </h2>

          {level !== 'orders' && (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              ← Quay lại
            </button>
          )}
        </div>

        <DashboardFilters
          level={level}
          currentFilters={currentFilters}
          setCurrentFilters={setCurrentFilters}
          orderFilters={orderFilters}
          setOrderFilters={setOrderFilters}
          onReset={handleReset}
        />

        <div className="relative">
          {error ? (
            <div className="mb-4 flex min-h-[100px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-center text-red-700">
              {error}
            </div>
          ) : (
            <>
              {level === 'orders' && (
                <OrdersView
                  rows={orders}
                  onRowClick={handleSelectOrder}
                  pagination={ordersPagination}
                  onPageChange={(page) =>
                    setOrderFilters((prev) => ({ ...prev, page }))
                  }
                  loading={loading}
                />
              )}

              {level === 'items' && (
                <ItemsView
                  rows={items}
                  onRowClick={handleSelectItem}
                  pagination={itemsPagination}
                  onPageChange={(page) =>
                    setItemFilters((prev) => ({ ...prev, page }))
                  }
                  loading={loading}
                />
              )}

              {level === 'details' && (
                <DetailsView
                  rows={details}
                  onRowClick={handleSelectDetail}
                  pagination={detailsPagination}
                  onPageChange={(page) =>
                    setDetailFilters((prev) => ({ ...prev, page }))
                  }
                  loading={loading}
                />
              )}

              {level === 'batches' && (
                <BatchesView
                  rows={batches}
                  pagination={batchesPagination}
                  onPageChange={(page) =>
                    setBatchFilters((prev) => ({ ...prev, page }))
                  }
                  loading={loading}
                />
              )}
            </>
          )}

          {showLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px]">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                Đang tải dữ liệu...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

export default function getCurrentShiftInfo(date = new Date()) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const ca1Start = 6 * 60 + 10;
  const ca1End = 14 * 60 + 10;

  const ca2Start = 14 * 60 + 10;
  const ca2End = 22 * 60 + 10;

  let shift = '';
  let workDate = new Date(date); // clone date

  if (totalMinutes >= ca1Start && totalMinutes < ca1End) {
    shift = 'ca1';
  } else if (totalMinutes >= ca2Start && totalMinutes < ca2End) {
    shift = 'ca2';
  } else {
    shift = 'ca3';
    // Nếu thời gian hiện tại từ 00:00 đến 06:10 thì lùi ngày làm việc về hôm trước
    if (totalMinutes < ca1Start) {
      workDate.setDate(workDate.getDate() - 1);
    }
  }

  // Trả về cả ca và ngày làm việc
  return {
    shift,
    workDate: workDate.toISOString().split('T')[0], // yyyy-mm-dd
  };
}

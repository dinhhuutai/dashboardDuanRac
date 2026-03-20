export const dayPickerCss = `
.rdp { --rdp-cell-size: 40px; margin: 0; }
.rdp-caption_label { font-weight: 600; color: #0f172a; text-transform: capitalize; }
.rdp-day { border-radius: 14px; font-weight: 600; }
.rdp-range_middle .rdp-day_button {
  background: rgba(37, 99, 235, 0.12);
  border-radius: 12px;
}
.rdp-range_start .rdp-day_button,
.rdp-range_end .rdp-day_button {
  background: linear-gradient(to bottom, #60a5fa, #2563eb);
  color: white;
  border-radius: 14px;
}
`;
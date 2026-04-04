function BtnDarkSmall({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={[
        'rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800',
        'active:scale-[0.98]',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default BtnDarkSmall;
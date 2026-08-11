export function ChevronDecoration({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute left-0 top-[18%] hidden h-[180px] w-[48px] bg-primary md:block lg:h-[220px] lg:w-[56px]"
        style={{ clipPath: 'polygon(55% 0, 100% 0, 45% 100%, 0 100%)' }}
      />
      <div
        className="absolute left-8 top-[28%] hidden h-[140px] w-[32px] bg-primary-bright md:block lg:left-10 lg:h-[180px] lg:w-[40px]"
        style={{ clipPath: 'polygon(55% 0, 100% 0, 45% 100%, 0 100%)' }}
      />
      <div
        className="absolute right-0 top-[22%] hidden h-[200px] w-[48px] bg-primary md:block lg:h-[240px] lg:w-[56px]"
        style={{ clipPath: 'polygon(55% 0, 100% 0, 45% 100%, 0 100%)' }}
      />
      <div
        className="absolute right-8 top-[34%] hidden h-[120px] w-[28px] bg-primary-deep md:block lg:right-12 lg:h-[160px] lg:w-[36px]"
        style={{ clipPath: 'polygon(55% 0, 100% 0, 45% 100%, 0 100%)' }}
      />
    </div>
  );
}

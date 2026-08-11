export function UtilityStrip() {
  return (
    <div className="flex h-9 items-center bg-ink px-4 text-[13px] text-on-ink">
      <div className="mx-auto flex w-full max-w-[1366px] items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-medium tracking-wide">For Business</span>
          <span className="hidden text-steel sm:inline">|</span>
          <span className="hidden text-steel sm:inline">Task Management Workspace</span>
        </div>
        <span className="text-steel">Support · Order status · Sign in</span>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border flex items-center justify-between px-20 py-10">
      <span className="text-[13px] text-text-faint">
        &copy; 2026 MirrorX &mdash; Built on Somnia
      </span>
      <div className="flex gap-8">
        <a href="#" className="text-[13px] text-text-muted">
          Docs
        </a>
        <a href="#" className="text-[13px] text-text-muted">
          GitHub
        </a>
        <a href="#" className="text-[13px] text-text-muted">
          Twitter
        </a>
      </div>
    </footer>
  )
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  // This layout bypasses the admin layout's scrollable containers
  // to enable proper multi-page printing in Chrome and Safari
  return <>{children}</>
}

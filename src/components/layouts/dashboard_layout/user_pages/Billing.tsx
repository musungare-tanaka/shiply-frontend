export default function Billing() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="app-page-title">Billing</h1>
        <p className="app-page-subtitle">
          Review subscription details, invoices, and account spending once billing goes live.
        </p>
      </div>
      <div className="app-card">
        <p className="app-muted">
          Billing details are not connected yet. This page stays visible in production so the account area feels complete without implying that payments are already live.
        </p>
      </div>
    </div>
  );
}

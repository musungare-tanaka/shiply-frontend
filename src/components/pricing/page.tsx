import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPricingCatalog } from "../../lib/api";
import { currencyLabel, formatPrice, saveCurrency, storedCurrency } from "../../lib/pricing";
import type { PaymentCurrency, PricingCatalog } from "../../lib/types";

const Pricing = () => {
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null);
  const [currency, setCurrency] = useState<PaymentCurrency>(() => storedCurrency());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPricingCatalog();
      setCatalog(data);
      const preferred = storedCurrency(data.defaultCurrency);
      const selected = data.currencies.some((item) => item.code === preferred) ? preferred : data.defaultCurrency;
      setCurrency(selected);
      saveCurrency(selected);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pricing is temporarily unavailable");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleCurrency = () => {
    const next = currency === "USD" ? "ZWG" : "USD";
    setCurrency(next);
    saveCurrency(next);
  };
  const currencyOption = catalog?.currencies.find((item) => item.code === currency);

  return <section id="pricing" className="w-full scroll-mt-24 bg-white py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-[#474b4f] sm:text-4xl">Simple, transparent pricing</h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-600">Monthly plans based on the number of services you deploy.</p>
        <button type="button" onClick={toggleCurrency}
          className="mt-5 inline-flex min-h-10 items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          aria-label={`Switch pricing currency to ${currency === "USD" ? "ZiG" : "USD"}`}>⇄ {currencyLabel(currency)}</button>
        {currency === "ZWG" && catalog ? <p className="mt-2 text-xs text-gray-500">Estimated ZiG prices use the current configured rate. Checkout confirms the final amount.</p> : null}
      </div>
      {loading ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading pricing">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-xl bg-gray-100" />)}
      </div> : null}
      {!loading && error ? <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
        <p className="font-semibold text-red-800">Pricing is temporarily unavailable</p><p className="mt-1 text-sm text-red-700">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Retry</button>
      </div> : null}
      {!loading && catalog ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {catalog.plans.map((plan) => {
          const paid = plan.tier !== "FREE";
          const unavailable = paid && !currencyOption?.checkoutAvailable;
          const signupUrl = paid ? `/signup?plan=${plan.tier}&currency=${currency}` : "/signup";
          return <article key={plan.tier} className={`flex flex-col rounded-xl p-7 ${plan.tier === "STARTER" ? "border-2 border-[#474b4f] shadow-md" : "border border-gray-200"}`}>
            <h3 className="text-xl font-semibold text-[#474b4f]">{plan.displayName}</h3>
            <p className="mt-2 text-gray-500">{plan.maxServices === 1 ? "1 deployable service" : `Up to ${plan.maxServices} deployable services`}</p>
            <div className="mt-6"><span className="text-3xl font-bold text-[#474b4f]">{formatPrice(currency, plan.prices[currency])}</span><span className="text-gray-500"> / month</span></div>
            {currencyOption?.estimated && paid ? <p className="mt-1 text-xs text-gray-500">Estimated</p> : null}
            <ul className="mt-6 flex-1 space-y-3 text-gray-600"><li>✔ Monthly billing</li><li>✔ {plan.maxServices} service{plan.maxServices === 1 ? "" : "s"} maximum</li></ul>
            <Link to={signupUrl} className={`mt-8 block rounded-md py-2 text-center font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${unavailable ? "pointer-events-none bg-gray-100 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              aria-disabled={unavailable}>{unavailable ? `${currencyLabel(currency)} checkout unavailable` : paid ? `Choose ${plan.displayName}` : "Get started"}</Link>
          </article>;
        })}
      </div> : null}
    </div>
  </section>;
};

export default Pricing;

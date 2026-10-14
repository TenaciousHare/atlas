import CombinedChart from "./CombinedChart";
import MetricChart from "./MetricChart";

export default function Dashboard() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-xl font-semibold text-zinc-100">Dashboard</h2>
      <MetricChart
        title="Waga (kg)"
        column="weight_kg"
        unit="kg"
        color="#f5b945"
      />
      <MetricChart
        title="Pas (cm)"
        column="waist_cm"
        unit="cm"
        color="#60a5fa"
      />
      <CombinedChart />
    </section>
  );
}

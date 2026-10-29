import { HomePreview } from "@/components/features/home-preview";
import { data } from "@/lib/data";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const plans = await data.listPlans();
  return <HomePreview plans={plans} />;
}

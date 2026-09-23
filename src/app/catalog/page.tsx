import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { Loading } from "@/components/ui";
export default function CatalogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Catalog />
    </Suspense>
  );
}

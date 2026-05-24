import Breadcrumb from "@/components/layout/Breadcrumb";
import NewDistrictForm from "./NewDistrictForm";

export default function NewDistrictPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Operation TTG", href: "/dashboard/analytics" },
          { label: "Admin", href: "/admin/districts/new" },
          { label: "New district" },
        ]}
      />
      <div className="mt-6 max-w-2xl">
        <NewDistrictForm />
      </div>
    </>
  );
}

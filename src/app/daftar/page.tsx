import RegistrationForm from "./RegistrationForm";
import ClassInfoSection from "@/components/daftar/ClassInfoSection";

type SearchParams = Promise<{ class?: string; program?: string; voucher?: string }>;

// Server Component: parameter dibaca di sini agar seluruh form (termasuk H1) ada di HTML awal.
export default async function RegistrationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <>
      <RegistrationForm
        initialClassParam={params.class || params.program || ""}
        initialVoucher={params.voucher || ""}
      />
      <ClassInfoSection />
    </>
  );
}

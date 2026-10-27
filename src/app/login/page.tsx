import LoginForm from "./LoginForm";

// ?gratis=1: datang dari halaman /belajar-gratis, sapa sebagai pendaftar baru.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { gratis } = await searchParams;
  return <LoginForm mode="umum" gratis={gratis === "1"} />;
}

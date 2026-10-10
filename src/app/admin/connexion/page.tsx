import { adminConfigured } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return <LoginForm configured={adminConfigured()} />;
}

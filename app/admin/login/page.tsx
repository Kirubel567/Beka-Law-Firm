import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="font-display text-3xl font-medium text-(--p-text)">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-(--p-text-3)">
        The portal is for authorized staff of Belay Ketema &amp; Partners LLP.
      </p>
      <LoginForm />
    </div>
  );
}

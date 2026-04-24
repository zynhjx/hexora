import Header from "@/components/header";
import { UserProvider } from "@/context/user-context";
import AuthGuard from "@/components/auth-guard";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <AuthGuard>
        <div className="flex min-h-screen flex-col bg-theme-dark-blue">
          <Header />
          <main className="flex-1 flex flex-col overflow-hidden w-full">{children}</main>
        </div>
      </AuthGuard>
    </UserProvider>
  );
}

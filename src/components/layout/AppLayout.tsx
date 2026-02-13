import { ReactNode } from "react";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-end px-4 py-3">
          <UserMenu />
        </div>
      </header>
      <main className="pb-24">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default AppLayout;

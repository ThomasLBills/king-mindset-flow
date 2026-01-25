import { ReactNode } from "react";
import MobileNav from "./MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default AppLayout;

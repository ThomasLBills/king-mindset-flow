import { ReactNode } from "react";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";
import SpiritLedCrisisButton from "./SpiritLedCrisisButton";
import logo from "@/assets/liberated-kings-logo-white.png";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background" style={{ borderBottom: '1px solid #C9A84C', height: '56px' }}>
        <div className="flex items-center justify-center px-4 h-full relative">
          <img src={logo} alt="Liberated Kings" style={{ height: '2.1rem' }} />
          <div className="absolute right-4">
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="pb-28">
        {children}
      </main>
      <SpiritLedCrisisButton />
      <MobileNav />
    </div>
  );
};

export default AppLayout;

import { Header } from "./Header";
import { CircleMenu } from "./CircleMenu";
import { Footer } from "./Footer";
import { MenuProvider } from "~/context/MenuContext";

export function PageLayout({
  children,
  showCircleMenu = true,
}: {
  children: React.ReactNode;
  showCircleMenu?: boolean;
}) {
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        {showCircleMenu && <CircleMenu />}
        {children}
        <Footer />
      </div>
    </MenuProvider>
  );
}

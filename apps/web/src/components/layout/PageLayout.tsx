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
      <div className="bg-darkpurple flex min-h-screen flex-col">
        <Header />
        {showCircleMenu && <CircleMenu />}
        {/* At least a screen tall, so the footer never starts in view and jumps as content loads. */}
        <div className="flex min-h-svh flex-1 flex-col">{children}</div>
        <Footer />
      </div>
    </MenuProvider>
  );
}

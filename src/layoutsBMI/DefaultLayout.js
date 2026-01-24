import Header from "./components/Header/Header";
import TabBar from "./components/TabBar/TabBar";
import Footer from "./components/Footer/Footer";

function DefaultLayoutBMI({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      {/* chừa chỗ vì header fixed */}
      <div className="md:h-[64px] h-[0px]" />

      <main>{children}</main>

      {/* Footer web */}
      <Footer />

      {/* TabBar mobile */}
      <TabBar />
    </div>
  );
}

export default DefaultLayoutBMI;

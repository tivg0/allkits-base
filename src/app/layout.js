import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Allkits Simulator",
  description: "Powered by STEP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ margin: 0, padding: 0, border: 0, overflow: "hidden" }}
      >
        {children}
      </body>
    </html>
  );
}

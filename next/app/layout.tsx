import type { Metadata } from "next";
import "react-toastify/dist/ReactToastify.css";
import "../public/css/animate.min.css";
import "../public/css/global.css";
import { Provider } from "./_hooks/hook";
import { Slide, ToastContainer } from "react-toastify";

const title = "notalx  ";
const description = " ";

export const metadata: Metadata = {
  title: title,

  description: description,
  applicationName: "notalx",
  keywords: ["ecommerce", "shopping", "apparels and accessories"],
  publisher: "Hyperbird",
  authors: [{ name: "Hyperbird Team", url: "https://hyperbirdtech.com" }],
  openGraph: {
    type: "website",
    url: "https://notalx.com",
    title: title,
    description: description,
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 600,
        alt: "notalx",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@notalx",
    creator: "@notalx",
    title,
    description,
    // images:  "/images/logo.png",
  },

  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://notalx.com",
    languages: {
      "en-US": "https://notalx.com/en",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <ToastContainer
            position="top-right"
            autoClose={5126}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="dark"
            transition={Slide}
          />
        </Provider>
      </body>
    </html>
  );
}

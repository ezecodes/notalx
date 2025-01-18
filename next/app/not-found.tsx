// pages/404.tsx
import Link from "next/link";
import "../public/css/animate.min.css";

const Custom404 = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-center p-4"
      style={{
        backgroundColor: "var(--main-background)",
        color: "var(--text)",
      }}
    >
      <h1
        className="text-5xl font-bold mb-4 animate__animated animate__fadeInDown"
        style={{ color: "var(--primary-dark)" }}
      >
        404
      </h1>
      <p
        className="text-xl mb-6 animate__animated animate__fadeInUp"
        style={{ color: "var(--secondary-old)" }}
      >
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded transition-all duration-300 animate__animated animate__pulse animate__infinite"
        style={{
          backgroundColor: "var(--primary-gold)",
          color: "var(--white)",
        }}
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default Custom404;

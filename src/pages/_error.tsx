import type { NextPageContext } from "next";

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
        color: "white",
        backgroundColor: "#1a1a2e",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", color: "#FFD700" }}>
        {statusCode ?? "Error"}
      </h1>
      <p style={{ marginTop: "1rem" }}>
        {statusCode === 404 ? "Page not found" : "An error occurred"}
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" style={{ marginTop: "2rem", color: "#FFD700" }}>
        Go Home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default Error;

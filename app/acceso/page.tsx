import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "acceso · tlacuilo",
};

async function entrar(formData: FormData) {
  "use server";
  const clave = String(formData.get("clave") ?? "")
    .trim()
    .toLowerCase();
  const correcta = process.env.BETA_ACCESS_CODE ?? "beta";

  if (clave === correcta) {
    const jar = await cookies();
    jar.set("tlacuilo_beta", "ok", {
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    redirect("/");
  }
  redirect("/acceso?error=1");
}

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#15151D",
        color: "#ECEAF0",
        padding: "2rem",
      }}
    >
      <p style={{ fontSize: "0.85rem", letterSpacing: "0.08em" }}>
        tlacuilo · beta cerrada
      </p>
      <form
        action={entrar}
        style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
      >
        <input
          type="password"
          name="clave"
          autoFocus
          placeholder="clave"
          aria-label="clave de acceso"
          style={{
            background: "transparent",
            border: "1px solid #6E6BA0",
            color: "#ECEAF0",
            padding: "0.6rem 0.9rem",
            fontFamily: "inherit",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#6E6BA0",
            border: "1px solid #6E6BA0",
            color: "#15151D",
            padding: "0.6rem 1.1rem",
            fontFamily: "inherit",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          entrar
        </button>
      </form>
      {error ? (
        <p style={{ fontSize: "0.8rem", color: "#E8DC4A" }}>
          esa no es. pregunta en el grupo.
        </p>
      ) : null}
    </main>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#9794C4] text-black font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <a href="/">
          <img src="/logo.png" alt="TLACUILO" className="h-10 w-auto" />
        </a>
        <nav className="hidden md:flex gap-8 text-sm uppercase tracking-wide">
          <a href="/biblioteca" className="hover:underline">Biblioteca</a>
          <a href="#" className="hover:underline">Artoteca</a>
          <a href="#" className="hover:underline">Fonoteca</a>
          <a href="#" className="hover:underline">Editorial Tlacuilo</a>
        </nav>
        <div className="hidden md:flex gap-6 text-sm uppercase tracking-wide">
          <a href="#" className="hover:underline">Iniciar sesión</a>
          <a href="#" className="hover:underline">Crear cuenta</a>
        </div>
      </header>

      {/* Hero - Newsletter */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-16 max-w-7xl mx-auto items-center">
        <div className="bg-black/20 aspect-[4/3] rounded-sm flex items-center justify-center text-black/40 text-sm">
          [foto del espacio]
        </div>
        <div>
          <h2 className="text-5xl md:text-6xl font-serif leading-tight mb-8">
            No te pierdas nuestras selecciones del mes
          </h2>
          <input
            type="email"
            placeholder="Tu correo electrónico..."
            className="w-full bg-black text-white placeholder:text-white/60 px-6 py-4 rounded-full mb-6 outline-none"
          />
          <p className="text-sm leading-relaxed max-w-md">
            Recomendaciones de libros, vinilos y arte; invitaciones a nuestros círculos de lectura y presentaciones editoriales. Una vez al mes, sin saturarte el correo.
          </p>
        </div>
      </section>
    </main>
  );
}
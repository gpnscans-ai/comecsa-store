import SocialLinks from "./SocialLinks";

const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default function Footer() {
  return (
    <footer className="bg-brand-600 py-12 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-bold">COMECSA</h3>
          <p className="mt-2 text-sm text-white/80">La Libertad - Santa Elena</p>
          <p className="text-sm text-white/80">Lunes a Domingo 09:00 - 20:00</p>
        </div>

        <div>
          <h4 className="font-semibold">Redes Sociales</h4>
          <div className="mt-3">
            <SocialLinks />
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Contacto</h4>
          {PHONE && <p className="mt-2 text-sm text-white/80">📞 {PHONE}</p>}
          {WHATSAPP && <p className="text-sm text-white/80">💬 WhatsApp: {WHATSAPP}</p>}
          {!PHONE && !WHATSAPP && (
            <p className="mt-2 text-sm text-white/60">Completa tus datos en /admin/configuracion</p>
          )}
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-white/60">
        © {new Date().getFullYear()} COMECSA - Todos los derechos reservados
      </p>
    </footer>
  );
}

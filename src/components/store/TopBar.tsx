import SocialLinks from "./SocialLinks";

const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function TopBar() {
  return (
    <div className="bg-brand-600 py-2 text-xs text-white/90">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 sm:flex-row">
        <p className="flex flex-wrap items-center justify-center gap-x-2">
          {PHONE && <span>📞 {PHONE}</span>}
          {PHONE && EMAIL && <span className="hidden sm:inline">|</span>}
          {EMAIL && <span>📧 {EMAIL}</span>}
          {!PHONE && !EMAIL && <span>Completa tus datos de contacto en /admin/configuracion</span>}
        </p>
        <SocialLinks />
      </div>
    </div>
  );
}

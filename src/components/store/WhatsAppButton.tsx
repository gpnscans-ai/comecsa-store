import { whatsappLink } from "@/lib/utils";

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;

  return (
    <a
      href={whatsappLink(number, "Hola COMECSA! Quiero consultar por un producto")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
    >
      💬 WhatsApp
    </a>
  );
}

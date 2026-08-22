const SOCIALS = [
  {
    name: "Facebook",
    url: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    url: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.43.4a4.9 4.9 0 0 1 1.77 1.15 4.9 4.9 0 0 1 1.15 1.77c.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.16-.46-.35-1.26-.4-2.43C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.43a4.9 4.9 0 0 1 1.15-1.77 4.9 4.9 0 0 1 1.77-1.15c.46-.16 1.26-.35 2.43-.4C8.42 2.21 8.8 2.2 12 2.2Zm0 3.05a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Zm0 2.16a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm6.4-1.6a1.06 1.06 0 1 1-2.13 0 1.06 1.06 0 0 1 2.13 0Z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    url: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M16.6 2h-3.1v13.7a2.9 2.9 0 1 1-2.05-2.77V9.7a6.1 6.1 0 1 0 5.15 6.03V8.34a7.9 7.9 0 0 0 4.6 1.47V6.7a4.8 4.8 0 0 1-4.6-4.7Z" />
      </svg>
    ),
  },
  {
    name: "Twitter",
    url: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.3l-5.7-6.9L3.7 22H.6l8.1-9.3L.9 2h7.5l5.2 6.3L18.9 2Zm-1.3 18h1.8L7.5 4h-1.9l12 16Z" />
      </svg>
    ),
  },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {SOCIALS.map((s) =>
        s.url ? (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.name}
            title={s.name}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            {s.icon}
          </a>
        ) : (
          <span
            key={s.name}
            aria-label={`${s.name} (próximamente)`}
            title={`${s.name} — próximamente`}
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full text-white/15"
          >
            {s.icon}
          </span>
        )
      )}
    </div>
  );
}

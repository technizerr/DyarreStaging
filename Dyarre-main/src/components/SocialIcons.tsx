import { useSocialLinks } from "@/hooks/useSocialLinks";

const icons: Record<string, { label: string; svg: string }> = {
  instagram: {
    label: "Instagram",
    svg: "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  },
  tiktok: {
    label: "TikTok",
    svg: "M16.6 5.82A4.28 4.28 0 0 1 14.45 2h-3.2v13.67a2.6 2.6 0 0 1-2.6 2.41 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 2.6-2.6c.27 0 .53.04.78.1V9.7a5.9 5.9 0 0 0-.78-.05A5.88 5.88 0 0 0 2.77 15.5a5.88 5.88 0 0 0 5.88 5.88 5.88 5.88 0 0 0 5.88-5.88V9.62a7.57 7.57 0 0 0 4.47 1.45V7.82a4.28 4.28 0 0 1-2.4-2Z",
  },
  facebook: {
    label: "Facebook",
    svg: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  twitter: {
    label: "X",
    svg: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  linkedin: {
    label: "LinkedIn",
    svg: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  },
  youtube: {
    label: "YouTube",
    svg: "M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.35zM9.75 15.02V8.48l5.75 3.27z",
  },
};

interface SocialIconsProps {
  className?: string;
  iconSize?: number;
}

export function SocialIcons({ className = "", iconSize = 20 }: SocialIconsProps) {
  const { activeLinks } = useSocialLinks();

  if (activeLinks.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {activeLinks.map(([platform, url]) => {
        const icon = icons[platform];
        if (!icon) return null;
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={icon.label}
            className="text-muted-foreground hover:text-accent transition-colors"
          >
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
              <path d={icon.svg} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}

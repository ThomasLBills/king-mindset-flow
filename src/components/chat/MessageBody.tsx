import { cn } from "@/lib/utils";
import { parseMessage, type MessageEmbed } from "@/lib/messageContent";

/**
 * Renders a chat message's text: plain text stays text, URLs become clickable
 * links, and Vimeo/YouTube links become inline video players. Shared by every
 * chat surface (channels + DMs) so media rendering can't drift per-screen.
 * Image attachments (message.image_url) are rendered separately by the caller.
 */

const VideoEmbed = ({ embed }: { embed: MessageEmbed }) => {
  const src =
    embed.kind === "vimeo"
      ? `https://player.vimeo.com/video/${embed.id}?dnt=1${embed.hash ? `&h=${embed.hash}` : ""}&playsinline=1`
      : `https://www.youtube-nocookie.com/embed/${embed.id}?playsinline=1`;
  return (
    <div className="mt-1.5 w-full max-w-[480px] overflow-hidden rounded-lg border border-line">
      <div className="relative aspect-video">
        <iframe
          src={src}
          className="absolute inset-0 h-full w-full"
          title={embed.kind === "vimeo" ? "Vimeo video" : "YouTube video"}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="lazy"
          // Video URL is built from an extracted id only; sandbox still limits the frame.
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        />
      </div>
    </div>
  );
};

export const MessageBody = ({
  content,
  own,
}: {
  content: string;
  own?: boolean;
}) => {
  const { tokens, embeds } = parseMessage(content);
  const hasText = tokens.some((t) => (t.kind === "link" ? true : t.value.trim() !== ""));

  return (
    <>
      {hasText && (
        <p
          className={cn(
            "inline-block max-w-full whitespace-pre-wrap break-words rounded-lg border px-3.5 py-2.5 text-left text-sm leading-relaxed [overflow-wrap:anywhere]",
            own ? "border-gold-deep/60 bg-raised-2 text-bone" : "border-line bg-raised text-bone-2"
          )}
        >
          {tokens.map((t, i) =>
            t.kind === "link" ? (
              <a
                key={i}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-gold underline underline-offset-2 hover:text-gold-bright [overflow-wrap:anywhere]"
              >
                {t.label}
              </a>
            ) : (
              <span key={i}>{t.value}</span>
            )
          )}
        </p>
      )}
      {embeds.map((e, i) => (
        <VideoEmbed key={i} embed={e} />
      ))}
    </>
  );
};

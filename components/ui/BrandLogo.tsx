import Image from "next/image";
import s from "./BrandLogo.module.css";

/**
 * UniVerse brand mark, using the delivered local raster assets (public/brand):
 * the swash "U" icon alone when collapsed, the full "UniVerse" lockup otherwise.
 * `dark` selects the variant made for dark surfaces (e.g. the auth shell).
 */
export default function BrandLogo({
  mark = false,
  dark = false,
  className,
}: {
  mark?: boolean;
  dark?: boolean;
  className?: string;
}) {
  if (mark) {
    return (
      <Image
        src={dark ? "/brand/logo-icon-dark.png" : "/brand/logo-icon.png"}
        alt="UniVerse"
        width={103}
        height={103}
        priority
        className={`${s.icon} ${className ?? ""}`}
      />
    );
  }
  return (
    <Image
      src={dark ? "/brand/logo-horizontal-dark.png" : "/brand/logo-horizontal.png"}
      alt="UniVerse"
      width={383}
      height={106}
      priority
      className={`${s.wordmark} ${className ?? ""}`}
    />
  );
}

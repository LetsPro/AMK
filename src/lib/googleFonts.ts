export const GOOGLE_FONTS = [
  "ABeeZee", "Abel", "Abhaya Libre", "Abril Fatface", "Alegreya", "Alegreya Sans",
  "Alfa Slab One", "Almarai", "Amatic SC", "Anton", "Archivo", "Arimo", "Arvo",
  "Assistant", "Barlow", "Barlow Condensed", "Bitter", "Bodoni Moda", "Cabin", "Cairo",
  "Candal", "Cardo", "Catamaran", "Caveat", "Cormorant Garamond", "Crimson Text",
  "DM Sans", "DM Serif Display", "Dancing Script", "Dosis", "EB Garamond", "Exo 2",
  "Figtree", "Fjalla One", "Frank Ruhl Libre", "Fraunces", "Fredoka", "Gabarito",
  "Geologica", "Heebo", "Hind", "IBM Plex Mono", "IBM Plex Sans", "IBM Plex Serif",
  "Inconsolata", "Inter", "Josefin Sans", "Jost", "Kanit", "Karla", "Lato",
  "League Spartan", "Lexend", "Libre Baskerville", "Libre Franklin", "Lora", "Manrope",
  "Merriweather", "Merriweather Sans", "Montserrat", "Mukta", "Mulish", "Noto Sans",
  "Noto Serif", "Nunito", "Nunito Sans", "Old Standard TT", "Open Sans", "Orbitron",
  "Oswald", "Outfit", "Overpass", "Oxygen", "Pacifico", "Playfair Display",
  "Plus Jakarta Sans", "Poppins", "Prompt", "PT Sans", "PT Serif", "Quicksand",
  "Raleway", "Roboto", "Roboto Condensed", "Roboto Mono", "Roboto Slab", "Rubik", "Ruda",
  "Saira", "Satisfy", "Schibsted Grotesk", "Source Code Pro", "Source Sans 3",
  "Source Serif 4", "Space Grotesk", "Space Mono", "Spectral", "Syne", "Tajawal", "Teko",
  "Titillium Web", "Ubuntu", "Ubuntu Mono", "Urbanist", "Vollkorn", "Work Sans",
  "Yanone Kaffeesatz", "Zilla Slab"
] as const;

export function googleFontsUrl(fonts: string[]) {
  const families = [...new Set(fonts)]
    .map((font) => `family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@300;400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

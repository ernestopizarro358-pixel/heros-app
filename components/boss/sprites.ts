/**
 * Original pixel-art bosses. Each sprite is drawn as its LEFT half (the right
 * half is mirrored), one character per pixel; "." is transparent.
 */

export interface SpriteDef {
  id: string;
  name: string;
  palette: Record<string, string>;
  half: string[];
  /** Aura colour behind the sprite. */
  aura: string;
}

export const SPRITES: Record<string, SpriteDef> = {
  knight: {
    id: "knight",
    name: "Caballero carmesí",
    aura: "rgb(225 29 72 / 0.45)",
    palette: {
      k: "#140509",
      a: "#3d0d18",
      b: "#6e1729",
      c: "#a3283f",
      d: "#c94a5e",
      g: "#c9922f",
      y: "#f3cd6d",
      h: "#e3d6bb",
      H: "#9a8a6c",
      e: "#ffa53d",
      w: "#e8ecf2",
      s: "#9aa3b2",
      p: "#2a0710",
      f: "#ff9d47",
    },
    half: [
      "..h.........",
      "..hh........",
      "...hh...kkkk",
      "...Hhh.kbbbb",
      "....HHkbcccc",
      "......kbcdcc",
      "......kbcccc",
      "......kkkkkk",
      "......kbkeek",
      "......kbbkkb",
      "......kgbbbb",
      ".......kgggg",
      "...kkkkkkbbb",
      "..kccccckbcc",
      ".kcdyyccckbb",
      ".kcccccckbgy",
      "..kkkkkkbbgg",
      "...kbbbkbbys",
      "...kbcbkbgyw",
      "...kbbbkbkkw",
      "...kkkkkbcbw",
      "....kpbbcbkw",
      "...kppbbbbkw",
      "...kppkbkbkw",
      "..kpppkbkbks",
      "..kppkkbbkkf",
      ".kkkk.kkkk.f",
    ],
  },

  demon: {
    id: "demon",
    name: "Demonio de la excusa",
    aura: "rgb(249 115 22 / 0.4)",
    palette: {
      k: "#170408",
      r: "#a51d2d",
      R: "#6d0f1c",
      o: "#d9433d",
      h: "#ece2c6",
      H: "#a3957a",
      y: "#ffd23f",
      t: "#fafafa",
      m: "#2b0509",
      w: "#3b0a14",
      W: "#5e1524",
      f: "#ff8a3c",
    },
    half: [
      "h...........",
      "hh..........",
      ".hh.........",
      ".Hhh....kkkk",
      "..HHh.kkrrrr",
      "....kkrroooo",
      "....krroooor",
      "....krkkkrro",
      "....krrykkrr",
      "....krrrrrrr",
      "....krrmtmmm",
      "w...kkrrmmmm",
      "ww...kkrrrrr",
      "wWw.kkRrrrrr",
      "wWWwkRRrrfff",
      ".wWwkRRrrrrr",
      ".wWWkRRRrrrr",
      "..wwkkRRRrrr",
      "...w.kRRRRkk",
      ".....kRRRk..",
      ".....kRRk...",
      "....kkkkk...",
    ],
  },

  wraith: {
    id: "wraith",
    name: "Espectro de la duda",
    aura: "rgb(147 51 234 / 0.4)",
    palette: {
      k: "#0b0612",
      c: "#2b1a40",
      C: "#48306a",
      l: "#6b4c99",
      v: "#050308",
      e: "#7ef9ff",
      s: "#b69cf0",
    },
    half: [
      ".......kkkkk",
      "......kCCCCC",
      ".....kCCllll",
      ".....kCClvvv",
      "....kCCvvvvv",
      "....kCvvvvvv",
      "....kCvvevvv",
      "....kCvvvvvv",
      "...kCCcvvvvv",
      "...kCccCvvvv",
      "..kCcccCCCCC",
      "..kCcccCcCCl",
      ".kCccckcccCl",
      "ksCcc.kccccC",
      "ks.cc.kcccCC",
      ".k.ccskccccC",
      "...cc.kcccc.",
      "...kc..kccc.",
      "....c..kc.c.",
      "....k...k.c.",
      ".........k..",
    ],
  },

  golem: {
    id: "golem",
    name: "Gólem de la comodidad",
    aura: "rgb(251 191 36 / 0.35)",
    palette: {
      k: "#0d0f0c",
      s: "#5b5f57",
      S: "#3c3f3a",
      l: "#8a8f84",
      m: "#3f7a3a",
      M: "#65a85a",
      g: "#ffb84d",
      G: "#fff0b3",
    },
    half: [
      "......kkkkkk",
      ".....kllllll",
      ".....klsssss",
      ".....ksGgsss",
      ".....ksssSSS",
      ".....kSSSkkk",
      "..kkkkkkkkkk",
      ".kllMmkllsss",
      "kllMmmklssgg",
      "klsmMskssgGG",
      "klsssskssggg",
      "kssssSkSSSSS",
      "kSSssSkSSlll",
      "kSmSSSkSSsss",
      ".kSSk.kSSSSS",
      ".kMMk.kSSSkk",
      "..kk..kSSk..",
      "......kSSk..",
      ".....kllSSk.",
      ".....kkkkkk.",
    ],
  },

  slime: {
    id: "slime",
    name: "Rey Limo de la pereza",
    aura: "rgb(52 211 153 / 0.35)",
    palette: {
      k: "#05170f",
      g: "#2fbf71",
      G: "#1d8450",
      l: "#8ef5bd",
      w: "#ffffff",
      e: "#0b1a14",
      c: "#ffd23f",
      C: "#c48a12",
      r: "#ff5d7a",
    },
    half: [
      ".......c..c.",
      ".......cccrc",
      ".......CCCCC",
      ".....kkkkkkk",
      "...kkggggggg",
      "..kgllgggggg",
      ".kgllggggggg",
      ".kglgggggggg",
      "kgggggwwwggg",
      "kggggwweeggg",
      "kggggwweeggg",
      "kggggggggggg",
      "kgggggggkkkk",
      "kGggggggkrrr",
      "kGGgggggGkkk",
      "kGGGGggGGGGG",
      ".kGGGGGGGGGG",
      "..kkGGkGGGGG",
      "....kk.kkkkk",
    ],
  },
};

export function getSprite(id: string): SpriteDef {
  return SPRITES[id] ?? SPRITES.knight;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

/** Expands a sprite into a flat list of coloured pixels. */
export function spritePixels(sprite: SpriteDef): { pixels: Pixel[]; width: number; height: number } {
  const halfWidth = Math.max(...sprite.half.map((row) => row.length));
  const width = halfWidth * 2;
  const pixels: Pixel[] = [];
  sprite.half.forEach((row, y) => {
    const padded = row.padEnd(halfWidth, ".");
    const full = padded + [...padded].reverse().join("");
    [...full].forEach((char, x) => {
      const color = sprite.palette[char];
      if (color) pixels.push({ x, y, color });
    });
  });
  return { pixels, width, height: sprite.half.length };
}

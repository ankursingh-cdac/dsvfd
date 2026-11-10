import React from 'react';
import Svg, {
  Circle,
  Path,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

interface AnimalProps {
  size?: number;
}

// 🐱 CAT: Adorable Black & White Kitten with Pink Ears and Bright Green Eyes
export const CatIcon: React.FC<AnimalProps> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="catEar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFAAA6" />
          <Stop offset="100%" stopColor="#FF8B94" />
        </LinearGradient>
      </Defs>
      {/* Outer Ears */}
      <Path d="M18 38 L28 10 L46 28 Z" fill="#2C3A47" />
      <Path d="M82 38 L72 10 L54 28 Z" fill="#2C3A47" />
      {/* Inner Pink Ears */}
      <Path d="M23 34 L29 16 L41 27 Z" fill="url(#catEar)" />
      <Path d="M77 34 L71 16 L59 27 Z" fill="url(#catEar)" />
      {/* Head Base */}
      <Circle cx="50" cy="54" r="38" fill="#2C3A47" />
      {/* White Face Mask */}
      <Path
        d="M50 32 C38 32 30 40 28 54 C26 68 34 86 50 86 C66 86 74 68 72 54 C70 40 62 32 50 32 Z"
        fill="#FFFFFF"
      />
      {/* White Forehead Blaze */}
      <Path d="M47 30 L53 30 L51 44 L49 44 Z" fill="#FFFFFF" />
      {/* Rosy Cheeks */}
      <Ellipse cx="33" cy="62" rx="5" ry="3" fill="#FFB8B8" opacity={0.6} />
      <Ellipse cx="67" cy="62" rx="5" ry="3" fill="#FFB8B8" opacity={0.6} />
      {/* Big Green Eyes */}
      <Circle cx="37" cy="48" r="7.5" fill="#2ECC71" />
      <Circle cx="63" cy="48" r="7.5" fill="#2ECC71" />
      <Circle cx="37" cy="48" r="5" fill="#1B262C" />
      <Circle cx="63" cy="48" r="5" fill="#1B262C" />
      {/* Eye Highlights */}
      <Circle cx="35" cy="45" r="2.2" fill="#FFFFFF" />
      <Circle cx="61" cy="45" r="2.2" fill="#FFFFFF" />
      <Circle cx="38.5" cy="50" r="1.1" fill="#FFFFFF" />
      <Circle cx="64.5" cy="50" r="1.1" fill="#FFFFFF" />
      {/* Cute Pink Nose */}
      <Path d="M47 56 L53 56 L50 60 Z" fill="#FF7979" />
      {/* Smiling Mouth */}
      <Path
        d="M45 61 Q50 65 50 61 Q50 65 55 61"
        fill="none"
        stroke="#49352E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Whiskers */}
      <Path d="M22 55 L12 53 M22 58 L11 58 M22 61 L13 64" stroke="#D1D8E0" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M78 55 L88 53 M78 58 L89 58 M78 61 L87 64" stroke="#D1D8E0" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
};

// 🐑 SHEEP: Fluffy White Lamb with Rosy Cheeks and Sweet Smile
export const SheepIcon: React.FC<AnimalProps> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Wool Clouds Background */}
      <Circle cx="30" cy="30" r="14" fill="#FFFFFF" />
      <Circle cx="50" cy="24" r="15" fill="#FFFFFF" />
      <Circle cx="70" cy="30" r="14" fill="#FFFFFF" />
      <Circle cx="22" cy="46" r="13" fill="#FFFFFF" />
      <Circle cx="78" cy="46" r="13" fill="#FFFFFF" />
      <Circle cx="26" cy="64" r="13" fill="#FFFFFF" />
      <Circle cx="74" cy="64" r="13" fill="#FFFFFF" />
      <Circle cx="40" cy="74" r="14" fill="#FFFFFF" />
      <Circle cx="60" cy="74" r="14" fill="#FFFFFF" />
      {/* Ears Drooping */}
      <Ellipse cx="16" cy="46" rx="9" ry="5" fill="#FFEAA7" transform="rotate(-20 16 46)" />
      <Ellipse cx="16" cy="46" rx="6" ry="3" fill="#FFB8B8" transform="rotate(-20 16 46)" />
      <Ellipse cx="84" cy="46" rx="9" ry="5" fill="#FFEAA7" transform="rotate(20 84 46)" />
      <Ellipse cx="84" cy="46" rx="6" ry="3" fill="#FFB8B8" transform="rotate(20 84 46)" />
      {/* Face Center */}
      <Ellipse cx="50" cy="54" rx="25" ry="22" fill="#FFF3CD" />
      {/* Rosy Cheeks */}
      <Circle cx="35" cy="60" r="4.5" fill="#FFB8B8" opacity={0.7} />
      <Circle cx="65" cy="60" r="4.5" fill="#FFB8B8" opacity={0.7} />
      {/* Eyes */}
      <Ellipse cx="38" cy="49" rx="4.5" ry="5.5" fill="#49352E" />
      <Ellipse cx="62" cy="49" rx="4.5" ry="5.5" fill="#49352E" />
      <Circle cx="36.5" cy="47" r="1.8" fill="#FFFFFF" />
      <Circle cx="60.5" cy="47" r="1.8" fill="#FFFFFF" />
      {/* Little Nose & Smile */}
      <Path d="M47 57 L53 57 L50 60 Z" fill="#F48FB1" />
      <Path d="M46 61 Q50 66 54 61" fill="none" stroke="#49352E" strokeWidth="2.2" strokeLinecap="round" />
      {/* Wool Tuft on Forehead */}
      <Circle cx="44" cy="35" r="7" fill="#FFFFFF" />
      <Circle cx="56" cy="35" r="7" fill="#FFFFFF" />
      <Circle cx="50" cy="32" r="7" fill="#FFFFFF" />
    </Svg>
  );
};

// 🐼 PANDA: Chubby Cute Panda with Bamboo-loving Smile
export const PandaIcon: React.FC<AnimalProps> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Black Ears */}
      <Circle cx="24" cy="26" r="14" fill="#2C3A47" />
      <Circle cx="76" cy="26" r="14" fill="#2C3A47" />
      <Circle cx="24" cy="26" r="7" fill="#4A5568" />
      <Circle cx="76" cy="26" r="7" fill="#4A5568" />
      {/* White Chubby Head */}
      <Circle cx="50" cy="54" r="36" fill="#FFFFFF" />
      {/* Dark Eye Patches */}
      <Ellipse cx="35" cy="48" rx="10" ry="12" fill="#2C3A47" transform="rotate(-15 35 48)" />
      <Ellipse cx="65" cy="48" rx="10" ry="12" fill="#2C3A47" transform="rotate(15 65 48)" />
      {/* Eyes Inside Patches */}
      <Circle cx="36" cy="48" r="4.5" fill="#FFFFFF" />
      <Circle cx="64" cy="48" r="4.5" fill="#FFFFFF" />
      <Circle cx="36" cy="48" r="2.8" fill="#1A202C" />
      <Circle cx="64" cy="48" r="2.8" fill="#1A202C" />
      <Circle cx="35" cy="46.5" r="1.2" fill="#FFFFFF" />
      <Circle cx="63" cy="46.5" r="1.2" fill="#FFFFFF" />
      {/* Rosy Blush */}
      <Circle cx="27" cy="62" r="5" fill="#FFB8B8" opacity={0.5} />
      <Circle cx="73" cy="62" r="5" fill="#FFB8B8" opacity={0.5} />
      {/* Black Cute Nose */}
      <Ellipse cx="50" cy="58" rx="4.5" ry="3.5" fill="#2C3A47" />
      {/* Smiling Mouth */}
      <Path d="M46 62 Q50 67 54 62" fill="none" stroke="#2C3A47" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
};

// 🐶 DOG: Cheerful Golden Puppy with Floppy Ears and Happy Tongue
export const DogIcon: React.FC<AnimalProps> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Floppy Caramel Ears */}
      <Path d="M22 30 C10 40 8 65 20 68 C28 70 30 52 28 36 Z" fill="#D35400" />
      <Path d="M78 30 C90 40 92 65 80 68 C72 70 70 52 72 36 Z" fill="#D35400" />
      {/* Head */}
      <Circle cx="50" cy="52" r="32" fill="#F39C12" />
      {/* Forehead Stripe */}
      <Path d="M47 22 L53 22 L52 42 L48 42 Z" fill="#FDEBD0" />
      {/* Muzzle */}
      <Ellipse cx="50" cy="64" rx="16" ry="13" fill="#FDEBD0" />
      {/* Eyes */}
      <Circle cx="37" cy="48" r="6" fill="#49352E" />
      <Circle cx="63" cy="48" r="6" fill="#49352E" />
      <Circle cx="35" cy="46" r="2.2" fill="#FFFFFF" />
      <Circle cx="61" cy="46" r="2.2" fill="#FFFFFF" />
      {/* Wet Black Nose */}
      <Ellipse cx="50" cy="59" rx="5" ry="3.8" fill="#2C3A47" />
      {/* Happy Open Tongue */}
      <Path d="M47 67 Q50 75 53 67 Z" fill="#FF7675" />
      <Path d="M44 65 Q50 70 56 65" fill="none" stroke="#49352E" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

// 🐴 HORSE: Friendly Brown Pony with Mane and Sweet Gaze
export const HorseIcon: React.FC<AnimalProps> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Mane on Top */}
      <Path d="M42 16 C46 8 54 8 58 16 C62 24 62 34 50 34 Z" fill="#4A2810" />
      {/* Ears */}
      <Path d="M30 32 L36 14 L46 26 Z" fill="#8D5524" />
      <Path d="M70 32 L64 14 L54 26 Z" fill="#8D5524" />
      <Path d="M33 30 L37 18 L44 26 Z" fill="#F4A261" />
      <Path d="M67 30 L63 18 L56 26 Z" fill="#F4A261" />
      {/* Head */}
      <Path
        d="M34 38 C34 28 66 28 66 38 C66 52 64 68 62 76 C60 82 40 82 38 76 C36 68 34 52 34 38 Z"
        fill="#8D5524"
      />
      {/* White Star Blaze on Forehead */}
      <Path d="M50 36 L52 42 L56 43 L52 46 L53 50 L50 47 L47 50 L48 46 L44 43 L48 42 Z" fill="#FFFFFF" />
      {/* Soft Snout */}
      <Ellipse cx="50" cy="74" rx="12" ry="7" fill="#C68B59" />
      <Circle cx="45" cy="74" r="1.8" fill="#4A2810" />
      <Circle cx="55" cy="74" r="1.8" fill="#4A2810" />
      {/* Eyes */}
      <Circle cx="38" cy="46" r="5" fill="#3D1C06" />
      <Circle cx="62" cy="46" r="5" fill="#3D1C06" />
      <Circle cx="36.5" cy="44.5" r="1.8" fill="#FFFFFF" />
      <Circle cx="60.5" cy="44.5" r="1.8" fill="#FFFFFF" />
    </Svg>
  );
};

// 🐮 COW: Cute Dairy Calf with Black & White Spots and Pink Snout
export const CowIcon: React.FC<AnimalProps> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Tiny Horns */}
      <Path d="M28 26 Q24 16 32 18 Q34 24 32 28 Z" fill="#F5CD79" />
      <Path d="M72 26 Q76 16 68 18 Q66 24 68 28 Z" fill="#F5CD79" />
      {/* Floppy Cow Ears */}
      <Ellipse cx="18" cy="38" rx="10" ry="5" fill="#FFFFFF" transform="rotate(-15 18 38)" />
      <Ellipse cx="18" cy="38" rx="6" ry="3" fill="#FFB8B8" transform="rotate(-15 18 38)" />
      <Ellipse cx="82" cy="38" rx="10" ry="5" fill="#2C3A47" transform="rotate(15 82 38)" />
      <Ellipse cx="82" cy="38" rx="6" ry="3" fill="#FFB8B8" transform="rotate(15 82 38)" />
      {/* Head */}
      <Circle cx="50" cy="50" r="32" fill="#FFFFFF" />
      {/* Black Spot on Eye */}
      <Path d="M50 22 C64 22 76 34 74 52 C72 56 60 56 56 46 C52 38 48 30 50 22 Z" fill="#2C3A47" />
      {/* Eyes */}
      <Circle cx="36" cy="44" r="5.5" fill="#2C3A47" />
      <Circle cx="64" cy="44" r="5.5" fill="#2C3A47" />
      <Circle cx="34.5" cy="42" r="2" fill="#FFFFFF" />
      <Circle cx="62.5" cy="42" r="2" fill="#FFFFFF" />
      {/* Big Pink Muzzle */}
      <Ellipse cx="50" cy="66" rx="18" ry="12" fill="#FFCCD5" />
      <Ellipse cx="43" cy="65" rx="2.5" ry="3.5" fill="#49352E" />
      <Ellipse cx="57" cy="65" rx="2.5" ry="3.5" fill="#49352E" />
      {/* Gentle Smile */}
      <Path d="M46 72 Q50 75 54 72" fill="none" stroke="#49352E" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

export const AnimalIconMap: Record<number, React.FC<AnimalProps>> = {
  1: CatIcon,
  2: SheepIcon,
  3: PandaIcon,
  4: DogIcon,
  5: HorseIcon,
  6: CowIcon,
};

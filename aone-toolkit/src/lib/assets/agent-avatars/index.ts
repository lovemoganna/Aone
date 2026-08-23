/**
 * Agent 3D 拟人化数字专家形象矢量资产库（东方现代精美审美版）
 * High-Fidelity 3D Personified Digital Expert Character Avatars (East Asian Aesthetic Edition)
 */

export interface AvatarSpec {
    id: string;
    title: string;
    role: string;
    accentColor: string;
    glowColor: string;
    gradient: string;
    svgContent: string;
}

export const AGENT_AVATARS: Record<string, AvatarSpec> = {
    // ========== 1. 拆局者 (东方未来架构师 - 儒雅极客) ==========
    decomposer: {
        id: 'decomposer',
        title: '拆局者',
        role: '结构化拆解',
        accentColor: '#FF6B35',
        glowColor: 'rgba(255, 107, 53, 0.45)',
        gradient: 'from-orange-500 via-amber-500 to-red-500',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="dec-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FF9E66" />
                    <stop offset="60%" stop-color="#FF6B35" />
                    <stop offset="100%" stop-color="#C83803" />
                </radialGradient>
                <linearGradient id="dec-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#242B35" />
                    <stop offset="60%" stop-color="#181E26" />
                    <stop offset="100%" stop-color="#0F141C" />
                </linearGradient>
                <linearGradient id="dec-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF5EC" />
                    <stop offset="100%" stop-color="#FDE2D0" />
                </linearGradient>
                <linearGradient id="dec-coat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2D3748" />
                    <stop offset="60%" stop-color="#1A202C" />
                    <stop offset="100%" stop-color="#111827" />
                </linearGradient>
                <linearGradient id="dec-lens" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.85" />
                    <stop offset="100%" stop-color="#00A3FF" stop-opacity="0.5" />
                </linearGradient>
                <filter id="dec-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Base Orb -->
            <circle cx="50" cy="50" r="48" fill="url(#dec-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Cyber Guochao Tech Lattice Lines -->
            <path d="M18,30 L50,14 L82,30 M50,14 L50,86 M20,74 L50,86 L80,74" stroke="rgba(255,255,255,0.22)" stroke-width="0.9" stroke-dasharray="3,2" fill="none" />

            <!-- Body / Modern High-Collar Cyber Trench Coat -->
            <path d="M22,96 C24,78 35,69 50,69 C65,69 76,78 78,96 Z" fill="url(#dec-coat)" />
            <!-- Orange Accent Collar Line -->
            <path d="M35,69 L30,59 L42,65 Z" fill="#FF8A50" />
            <path d="M65,69 L70,59 L58,65 Z" fill="#FF6B35" />
            <path d="M43,65 L50,76 L57,65 L50,61 Z" fill="#E65100" opacity="0.6" />

            <!-- Neck (Slender East Asian proportion) -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#dec-skin)" />
            
            <!-- Head & Face (Clean V-line jaw) -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#dec-skin)" />
            <!-- Soft Cheeks Blush -->
            <circle cx="39" cy="45" r="4" fill="#FF8A80" opacity="0.25" />
            <circle cx="61" cy="45" r="4" fill="#FF8A80" opacity="0.25" />

            <!-- Modern Asian Comma Haircut (逗号刘海 / 层次黑发) -->
            <!-- Back & Top Hair Volume -->
            <path d="M29,38 C27,24 37,16 51,16 C63,16 71,23 71,36 C66,27 58,24 49,25 C39,26 33,31 29,38 Z" fill="url(#dec-hair)" />
            <!-- Comma Fringe / Front bangs sweeping gracefully across forehead -->
            <path d="M31,31 C35,23 44,24 48,29 C45,31 38,34 32,37 Z" fill="url(#dec-hair)" />
            <path d="M48,27 C54,23 63,25 67,34 C63,33 56,33 50,30 Z" fill="url(#dec-hair)" />
            <!-- Hair Gloss / Angel Ring Highlight (发丝天使光环) -->
            <path d="M41,20 C47,19 55,21 60,24" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" stroke-linecap="round" fill="none" />

            <!-- Delicate Ears -->
            <path d="M31,39 C30,42 31,46 33,47" stroke="#F0B89C" stroke-width="1.8" stroke-linecap="round" fill="none" />
            <path d="M69,39 C70,42 69,46 67,47" stroke="#F0B89C" stroke-width="1.8" stroke-linecap="round" fill="none" />

            <!-- Eyebrows (Slender, focused) -->
            <path d="M37,35 Q42,33 46,35" stroke="#1E293B" stroke-width="1.4" stroke-linecap="round" fill="none" />
            <path d="M54,35 Q58,33 63,35" stroke="#1E293B" stroke-width="1.4" stroke-linecap="round" fill="none" />
            
            <!-- Left Eye (Refined almond shape, silky black iris + double anime highlight) -->
            <path d="M38,39 Q42,37 46,39" stroke="#0F172A" stroke-width="1.3" fill="none" />
            <ellipse cx="42" cy="41" rx="2.5" ry="3" fill="#181E26" />
            <ellipse cx="42" cy="41" rx="1.8" ry="2.2" fill="#242B35" />
            <circle cx="41.3" cy="39.8" r="0.9" fill="#FFFFFF" />
            <circle cx="43" cy="42.2" r="0.5" fill="#FFFFFF" opacity="0.8" />
            
            <!-- Right Eye: Tech Spectra Monocle (HUD 细边全息镜) -->
            <circle cx="58" cy="41" r="5.5" fill="url(#dec-lens)" stroke="#00F0FF" stroke-width="1" filter="url(#dec-glow)" />
            <circle cx="58" cy="41" r="2.2" fill="#003859" />
            <circle cx="57.3" cy="40" r="0.9" fill="#FFFFFF" />
            <!-- Delicate Golden Frame Stem -->
            <path d="M63.5,41 L67,43" stroke="#F59E0B" stroke-width="0.9" />
            <path d="M53,41 L52,41" stroke="#F59E0B" stroke-width="0.9" />

            <!-- Delicate Nose & Gentle Confident Lips -->
            <path d="M49.5,43 L48.8,47 L50.5,47" stroke="#D97706" stroke-width="0.8" stroke-linecap="round" fill="none" opacity="0.6" />
            <path d="M47,52 Q50,53.5 53,52" stroke="#B45309" stroke-width="1.3" stroke-linecap="round" fill="none" />

            <!-- Floating Data Prism Emblem -->
            <g transform="translate(68, 64) scale(0.65)">
                <polygon points="16,2 30,26 2,26" fill="#00E5FF" opacity="0.9" filter="url(#dec-glow)" />
                <polygon points="16,6 26,24 6,24" fill="#FFFFFF" opacity="0.4" />
                <line x1="16" y1="2" x2="16" y2="26" stroke="#FFFFFF" stroke-width="1" opacity="0.9" />
            </g>
        </svg>
        `
    },

    // ========== 2. 算账的 (东方知性精算大家 - 温婉睿智法官) ==========
    calculator: {
        id: 'calculator',
        title: '算账的',
        role: '量化权衡',
        accentColor: '#2EC4B6',
        glowColor: 'rgba(46, 196, 182, 0.45)',
        gradient: 'from-teal-500 via-emerald-500 to-cyan-500',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="calc-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#5DF3E1" />
                    <stop offset="55%" stop-color="#2EC4B6" />
                    <stop offset="100%" stop-color="#0E7473" />
                </radialGradient>
                <linearGradient id="calc-suit" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="calc-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2D2B38" />
                    <stop offset="60%" stop-color="#1F1D2B" />
                    <stop offset="100%" stop-color="#13121C" />
                </linearGradient>
                <linearGradient id="calc-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF8F2" />
                    <stop offset="100%" stop-color="#FDE4D8" />
                </linearGradient>
                <filter id="calc-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Background Sphere -->
            <circle cx="50" cy="50" r="48" fill="url(#calc-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Ambient Yin-Yang / Balance Harmonic Orbitals -->
            <circle cx="50" cy="50" r="41" stroke="rgba(255,255,255,0.2)" stroke-width="0.9" stroke-dasharray="4,3" fill="none" />
            <path d="M26,30 L74,30 M50,18 L50,42" stroke="rgba(255,255,255,0.25)" stroke-width="0.9" fill="none" />

            <!-- Modern Neo-Chinese Smart Blazer (新中式优雅立领西服) -->
            <path d="M22,96 C24,78 35,69 50,69 C65,69 76,78 78,96 Z" fill="url(#calc-suit)" />
            <!-- Silk Inner Lapel with Jade Teal Accent -->
            <path d="M43,69 L50,81 L57,69 Z" fill="#2EC4B6" opacity="0.8" />
            <line x1="50" y1="69" x2="50" y2="96" stroke="#4EECD8" stroke-width="1.2" opacity="0.6" />

            <!-- Slender Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#calc-skin)" />

            <!-- Graceful Face (Soft oval chin) -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#calc-skin)" />
            <circle cx="39" cy="45" r="4" fill="#FB7185" opacity="0.22" />
            <circle cx="61" cy="45" r="4" fill="#FB7185" opacity="0.22" />

            <!-- Elegant Short Bob / Neat Side Fringe (知性齐耳利落黑短发) -->
            <path d="M29,38 C27,24 37,16 51,16 C63,16 71,23 71,38 C71,46 67,52 66,54 C66,42 63,30 50,27 C37,30 34,42 34,54 C33,52 29,46 29,38 Z" fill="url(#calc-hair)" />
            <!-- Delicate Side Bangs -->
            <path d="M33,33 C38,24 47,24 50,29 C45,32 39,35 34,42 Z" fill="url(#calc-hair)" />
            <path d="M41,19 C47,18 55,20 60,23" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" stroke-linecap="round" fill="none" />

            <!-- Intellectual Slim Golden Frame Glasses (知性无框金丝细眼镜) -->
            <rect x="36" y="36" width="11" height="8" rx="2.5" fill="rgba(255,255,255,0.22)" stroke="#F59E0B" stroke-width="1" />
            <rect x="53" y="36" width="11" height="8" rx="2.5" fill="rgba(255,255,255,0.22)" stroke="#F59E0B" stroke-width="1" />
            <line x1="47" y1="39.5" x2="53" y2="39.5" stroke="#F59E0B" stroke-width="1" />

            <!-- Expressive Clear Almond Eyes behind Glasses -->
            <ellipse cx="41.5" cy="40" rx="2.4" ry="2.8" fill="#181E26" />
            <circle cx="40.8" cy="39" r="0.8" fill="#FFFFFF" />
            <circle cx="42.3" cy="41" r="0.4" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="58.5" cy="40" rx="2.4" ry="2.8" fill="#181E26" />
            <circle cx="57.8" cy="39" r="0.8" fill="#FFFFFF" />
            <circle cx="59.3" cy="41" r="0.4" fill="#FFFFFF" opacity="0.8" />

            <!-- Soft Delicate Eyebrows -->
            <path d="M37,33.5 Q42,32 46,34" stroke="#475569" stroke-width="1.3" stroke-linecap="round" fill="none" />
            <path d="M54,34 Q58,32 63,33.5" stroke="#475569" stroke-width="1.3" stroke-linecap="round" fill="none" />

            <!-- Small Nose & Gentle Composed Smile -->
            <path d="M49.5,43 L48.8,46.5 L50.5,46.5" stroke="#EA580C" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.5" />
            <path d="M47,51.5 Q50,53 53,51.5" stroke="#BE123C" stroke-width="1.3" stroke-linecap="round" fill="none" />

            <!-- Floating Hologram Balance Scale on Bottom Corner -->
            <g transform="translate(66, 62) scale(0.6)">
                <circle cx="16" cy="16" r="14" fill="#0F172A" stroke="#2EC4B6" stroke-width="1.4" filter="url(#calc-glow)" />
                <path d="M8,14 L24,14 M16,10 L16,22 M11,14 L9,19 M21,14 L23,19" stroke="#4EECD8" stroke-width="1.3" stroke-linecap="round" fill="none" />
                <path d="M7,19 Q9,21 11,19 M19,19 Q21,21 23,19" stroke="#4EECD8" stroke-width="1.3" fill="none" />
            </g>
        </svg>
        `
    },

    // ========== 3. 找路的 (东方阳光先锋探险家 - 元气灵动) ==========
    pathfinder: {
        id: 'pathfinder',
        title: '找路的',
        role: '可能性探索',
        accentColor: '#E8C547',
        glowColor: 'rgba(232, 197, 71, 0.5)',
        gradient: 'from-amber-400 via-yellow-500 to-orange-500',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="path-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FEF08A" />
                    <stop offset="55%" stop-color="#EAB308" />
                    <stop offset="100%" stop-color="#A16207" />
                </radialGradient>
                <linearGradient id="path-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E3A8A" />
                    <stop offset="60%" stop-color="#1E293B" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="path-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#452719" />
                    <stop offset="60%" stop-color="#2D1A10" />
                    <stop offset="100%" stop-color="#1A0F0A" />
                </linearGradient>
                <linearGradient id="path-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF7ED" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Background Sphere -->
            <circle cx="50" cy="50" r="48" fill="url(#path-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Compass Rings and Starlight trails in background -->
            <circle cx="50" cy="50" r="41" stroke="rgba(255,255,255,0.25)" stroke-width="0.9" stroke-dasharray="3,3" fill="none" />
            <path d="M50,8 L52,14 L50,20 L48,14 Z M50,80 L52,86 L50,92 L48,86 Z" fill="rgba(255,255,255,0.45)" />

            <!-- Tactical Guochao Tech Jacket (机能工装战术外套) -->
            <path d="M22,96 C24,78 35,69 50,69 C65,69 76,78 78,96 Z" fill="url(#path-jacket)" />
            <!-- Golden Tech Straps & Zipper -->
            <path d="M50,69 L50,96" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" />
            <path d="M33,74 L41,82 M67,74 L59,82" stroke="#FBBF24" stroke-width="1.1" stroke-linecap="round" />
            
            <!-- Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#path-skin)" />

            <!-- Head & Face (Youthful, spirited East Asian profile) -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#path-skin)" />
            <!-- Cheerful Peach Blush -->
            <circle cx="39" cy="45" r="4.5" fill="#FB923C" opacity="0.25" />
            <circle cx="61" cy="45" r="4.5" fill="#FB923C" opacity="0.25" />

            <!-- Fluffy Layered Brown Hair (蓬松层次碎发) -->
            <path d="M29,37 C27,24 37,16 50,16 C62,16 71,23 71,35 C65,28 58,25 48,26 C38,27 34,31 29,37 Z" fill="url(#path-hair)" />
            <!-- Playful Hair Tuft popping up -->
            <path d="M50,16 C53,10 59,10 61,14 C58,15 54,16 50,16 Z" fill="url(#path-hair)" />
            <path d="M32,32 C36,25 44,25 49,30 C45,32 39,35 33,40 Z" fill="url(#path-hair)" />

            <!-- Explorer Headband / Goggles on Forehead (机能探险防风镜) -->
            <g transform="translate(0, -3)">
                <rect x="34" y="24" width="14" height="8" rx="3.5" fill="#0284C7" stroke="#F8FAFC" stroke-width="1" />
                <rect x="52" y="24" width="14" height="8" rx="3.5" fill="#0284C7" stroke="#F8FAFC" stroke-width="1" />
                <line x1="48" y1="28" x2="52" y2="28" stroke="#334155" stroke-width="1.8" />
                <path d="M29,28 L34,28 M66,28 L71,28" stroke="#334155" stroke-width="1.8" />
                <line x1="37" y1="26" x2="44" y2="29" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" opacity="0.8" />
                <line x1="55" y1="26" x2="62" y2="29" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" opacity="0.8" />
            </g>

            <!-- Ears -->
            <path d="M31,39 C30,42 31,46 33,47" stroke="#F0B89C" stroke-width="1.8" stroke-linecap="round" fill="none" />
            <path d="M69,39 C70,42 69,46 67,47" stroke="#F0B89C" stroke-width="1.8" stroke-linecap="round" fill="none" />

            <!-- Spirited Almond Eyes with High Shine (灵动明亮东方大眼) -->
            <path d="M37,34 Q42,32 46,34" stroke="#451A03" stroke-width="1.4" stroke-linecap="round" fill="none" />
            <path d="M54,34 Q58,32 63,34" stroke="#451A03" stroke-width="1.4" stroke-linecap="round" fill="none" />

            <ellipse cx="41.5" cy="40.5" rx="2.8" ry="3.2" fill="#1C1917" />
            <ellipse cx="41.5" cy="40.5" rx="2" ry="2.4" fill="#451A03" />
            <circle cx="40.6" cy="39.2" r="1.1" fill="#FFFFFF" />
            <circle cx="42.6" cy="41.8" r="0.6" fill="#FFFFFF" opacity="0.9" />

            <ellipse cx="58.5" cy="40.5" rx="2.8" ry="3.2" fill="#1C1917" />
            <ellipse cx="58.5" cy="40.5" rx="2" ry="2.4" fill="#451A03" />
            <circle cx="57.6" cy="39.2" r="1.1" fill="#FFFFFF" />
            <circle cx="59.6" cy="41.8" r="0.6" fill="#FFFFFF" opacity="0.9" />

            <!-- Cute Nose & Lively Playful Grin (元气自信嘴角) -->
            <path d="M49.5,43 L48.8,46.5 L50.5,46.5" stroke="#C2410C" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.5" />
            <path d="M46,51.5 Q50,56 54,51.5" stroke="#C2410C" stroke-width="1.5" stroke-linecap="round" fill="none" />

            <!-- Glowing Quantum Spark / Compass Marker on Bottom Corner -->
            <g transform="translate(68, 64) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#1E1B4B" stroke="#FDE047" stroke-width="1.4" filter="url(#path-glow)" />
                <polygon points="15,4 18,12 26,15 18,18 15,26 12,18 4,15 12,12" fill="#FBBF24" />
                <circle cx="15" cy="15" r="2.2" fill="#FFFFFF" />
            </g>
        </svg>
        `
    },

    // ========== 4. 兜底的 (东方坚毅战术卫士 - 沉稳可靠特工) ==========
    stress_tester: {
        id: 'stress_tester',
        title: '兜底的',
        role: '压力测试',
        accentColor: '#7B68EE',
        glowColor: 'rgba(123, 104, 238, 0.5)',
        gradient: 'from-violet-500 via-purple-600 to-indigo-700',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="stress-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#B49BFA" />
                    <stop offset="55%" stop-color="#7C3AED" />
                    <stop offset="100%" stop-color="#431407" />
                </radialGradient>
                <linearGradient id="stress-armor" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#334155" />
                    <stop offset="50%" stop-color="#1E293B" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="stress-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF4EB" />
                    <stop offset="100%" stop-color="#FCDCC8" />
                </linearGradient>
                <filter id="stress-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Background Sphere -->
            <circle cx="50" cy="50" r="48" fill="url(#stress-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Hexagonal Force Shield Grid in background -->
            <polygon points="50,16 68,26 68,48 50,58 32,48 32,26" stroke="rgba(255,255,255,0.22)" stroke-width="0.9" fill="none" />
            <polygon points="50,22 62,29 62,45 50,52 38,45 38,29" stroke="rgba(255,255,255,0.15)" stroke-width="0.9" fill="none" />

            <!-- High Armor Body & Xuan-Jia Tactical Vest (玄甲高领机能战衣) -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#stress-armor)" />
            <!-- Tactical Chest Core -->
            <path d="M38,72 L50,81 L62,72 L50,67 Z" fill="#6D28D9" />
            <circle cx="50" cy="75" r="2.8" fill="#C4B5FD" filter="url(#stress-glow)" />

            <!-- Strong Slender Neck -->
            <rect x="44" y="54" width="12" height="12" rx="3" fill="url(#stress-skin)" />

            <!-- Chiseled Handsome Face Shape -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#stress-skin)" />

            <!-- Crisp Clean Asian Undercut / Sharp Short Hair (清爽干练剑眉短发) -->
            <path d="M30,36 C29,23 39,17 50,17 C61,17 70,23 70,36 C64,28 58,25 50,25 C42,25 36,28 30,36 Z" fill="#181528" />
            <path d="M38,22 C44,19 54,20 62,24" stroke="rgba(255,255,255,0.3)" stroke-width="1.1" stroke-linecap="round" fill="none" />

            <!-- Tactical Cyber Ear-Cuff / Comm on Ear (战术耳骨通讯器) -->
            <rect x="30" y="38" width="2.5" height="7" rx="1.2" fill="#7C3AED" filter="url(#stress-glow)" />
            <path d="M31,44 Q35,51 43,49" stroke="#A78BFA" stroke-width="1.2" stroke-linecap="round" fill="none" />
            <circle cx="43" cy="49" r="1.2" fill="#C4B5FD" />

            <!-- Resolute Sword Eyebrows (英气剑眉) -->
            <path d="M36,33.5 L46,35" stroke="#181528" stroke-width="1.8" stroke-linecap="round" />
            <path d="M54,35 L64,33.5" stroke="#181528" stroke-width="1.8" stroke-linecap="round" />

            <!-- Sharp Determined Eyes (目光如炬) -->
            <ellipse cx="41.5" cy="40.5" rx="2.5" ry="2.8" fill="#0F172A" />
            <circle cx="40.8" cy="39.5" r="0.9" fill="#FFFFFF" />
            <circle cx="42.5" cy="41.5" r="0.4" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="58.5" cy="40.5" rx="2.5" ry="2.8" fill="#0F172A" />
            <circle cx="57.8" cy="39.5" r="0.9" fill="#FFFFFF" />
            <circle cx="59.5" cy="41.5" r="0.4" fill="#FFFFFF" opacity="0.8" />

            <!-- Nose & Firm Reassuring Line -->
            <path d="M49.5,43 L48.8,46.5 L51,46.5" stroke="#92400E" stroke-width="0.9" fill="none" stroke-linecap="round" opacity="0.6" />
            <line x1="46" y1="52" x2="54" y2="52" stroke="#78350F" stroke-width="1.5" stroke-linecap="round" />

            <!-- Floating Sentinel Shield Emblem on Bottom Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#1E1B4B" stroke="#A78BFA" stroke-width="1.4" filter="url(#stress-glow)" />
                <path d="M15,6 L23,10 V16 C23,21 15,25 15,25 C15,25 7,21 7,16 V10 L15,6 Z" fill="#8B5CF6" stroke="#C4B5FD" stroke-width="1.1" />
                <path d="M15,10 V20 M10,14 H20" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" />
            </g>
        </svg>
        `
    },

    // ========== 5. 收网的 (东方敏捷交付官 - 干练飒爽) ==========
    closer: {
        id: 'closer',
        title: '收网的',
        role: '行动转化',
        accentColor: '#20BF55',
        glowColor: 'rgba(32, 191, 85, 0.45)',
        gradient: 'from-emerald-500 via-green-500 to-teal-600',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="close-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#6EE7B7" />
                    <stop offset="55%" stop-color="#10B981" />
                    <stop offset="100%" stop-color="#047857" />
                </radialGradient>
                <linearGradient id="close-uniform" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#064E3B" />
                    <stop offset="50%" stop-color="#065F46" />
                    <stop offset="100%" stop-color="#047857" />
                </linearGradient>
                <linearGradient id="close-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2D2833" />
                    <stop offset="60%" stop-color="#1C1824" />
                    <stop offset="100%" stop-color="#0F0C17" />
                </linearGradient>
                <linearGradient id="close-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF9F5" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <filter id="close-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Background Sphere -->
            <circle cx="50" cy="50" r="48" fill="url(#close-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Milestone Grid & Checklist in Background -->
            <path d="M22,30 L29,37 L44,22 M22,50 L29,57 L44,42" stroke="rgba(255,255,255,0.22)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <line x1="48" y1="30" x2="76" y2="30" stroke="rgba(255,255,255,0.22)" stroke-width="1.4" stroke-linecap="round" />
            <line x1="48" y1="50" x2="76" y2="50" stroke="rgba(255,255,255,0.22)" stroke-width="1.4" stroke-linecap="round" />

            <!-- Modern Asian Crisp Workwear (飒爽现代职场战袍) -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#close-uniform)" />
            <!-- Mint Green Clean Collar & Gold Star Pin -->
            <polygon points="50,69 44,63 56,63" fill="#A7F3D0" />
            <circle cx="61" cy="76" r="2.8" fill="#F59E0B" stroke="#FFFFFF" stroke-width="0.8" />

            <!-- Neck -->
            <rect x="45" y="54" width="10" height="12" rx="3" fill="url(#close-skin)" />

            <!-- Pretty, Dynamic Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#close-skin)" />
            <!-- Soft Blush -->
            <circle cx="39" cy="45" r="4.2" fill="#F43F5E" opacity="0.22" />
            <circle cx="61" cy="45" r="4.2" fill="#F43F5E" opacity="0.22" />

            <!-- Sleek High Ponytail / Stylish Layered Hair (干练高马尾与侧发) -->
            <path d="M30,36 C28,23 39,17 50,17 C61,17 70,23 70,36 C64,28 58,25 50,25 C42,25 36,28 30,36 Z" fill="url(#close-hair)" />
            <!-- Side Sweep Bangs -->
            <path d="M32,32 C37,24 46,24 50,29 C45,31 39,34 33,40 Z" fill="url(#close-hair)" />
            <!-- High Ponytail Knot at Top-Right -->
            <path d="M64,18 C72,12 76,17 74,25 C71,22 67,20 64,18 Z" fill="url(#close-hair)" />
            <circle cx="65" cy="18" r="2" fill="#10B981" />

            <!-- Eyebrows (Crisp, determined) -->
            <path d="M37,33.5 Q42,32 46,34" stroke="#0F172A" stroke-width="1.4" stroke-linecap="round" fill="none" />
            <path d="M54,34 Q58,32 63,33.5" stroke="#0F172A" stroke-width="1.4" stroke-linecap="round" fill="none" />

            <!-- Bright, Confident Eyes (清澈坚定杏仁眸) -->
            <ellipse cx="41.5" cy="40.5" rx="2.6" ry="3" fill="#0F172A" />
            <circle cx="40.7" cy="39.3" r="1" fill="#FFFFFF" />
            <circle cx="42.5" cy="41.7" r="0.5" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="58.5" cy="40.5" rx="2.6" ry="3" fill="#0F172A" />
            <circle cx="57.7" cy="39.3" r="1" fill="#FFFFFF" />
            <circle cx="59.5" cy="41.7" r="0.5" fill="#FFFFFF" opacity="0.8" />

            <!-- Delicate Nose & Energetic Decisive Smile -->
            <path d="M49.5,43 L48.8,46.5 L50.5,46.5" stroke="#C2410C" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.5" />
            <path d="M46,51 Q50,54.5 54,51" stroke="#065F46" stroke-width="1.5" stroke-linecap="round" fill="none" />

            <!-- Action Complete Badge / Laser Checkmark on Bottom Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#064E3B" stroke="#4ADE80" stroke-width="1.4" filter="url(#close-glow)" />
                <path d="M9,15 L13,19 L22,10" stroke="#4ADE80" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </g>
        </svg>
        `
    },

    // ========== 6. 协同中枢 (东方全知神使领航员 - 仙姿科技) ==========
    coordinator: {
        id: 'coordinator',
        title: '协同推演与策略规划',
        role: '调度协调中枢',
        accentColor: '#6366F1',
        glowColor: 'rgba(99, 102, 241, 0.5)',
        gradient: 'from-indigo-500 via-purple-600 to-pink-500',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="coord-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#939DFD" />
                    <stop offset="55%" stop-color="#4F46E5" />
                    <stop offset="100%" stop-color="#312E81" />
                </radialGradient>
                <linearGradient id="coord-core" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#E0E7FF" />
                    <stop offset="50%" stop-color="#A5B4FC" />
                    <stop offset="100%" stop-color="#6366F1" />
                </linearGradient>
                <filter id="coord-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Outer Orb -->
            <circle cx="50" cy="50" r="48" fill="url(#coord-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Orbital Rings (天体星轨与浑天仪光流) -->
            <ellipse cx="50" cy="50" rx="42" ry="17" stroke="rgba(192, 132, 252, 0.5)" stroke-width="1" fill="none" transform="rotate(-25 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="17" stroke="rgba(56, 189, 248, 0.5)" stroke-width="1" fill="none" transform="rotate(25 50 50)" />

            <!-- Personified Celestial Avatar (仙质流光领航者) -->
            <path d="M25,96 C27,78 36,68 50,68 C64,68 73,78 75,96 Z" fill="url(#coord-core)" opacity="0.88" />
            <circle cx="50" cy="77" r="3.5" fill="#FFFFFF" filter="url(#coord-glow)" />

            <rect x="45" y="55" width="10" height="11" rx="3" fill="#EEF2FF" />

            <!-- Face (Porcelain Pure Skin) -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="#F8FAFC" />
            <!-- Silk Indigo Hair (流光玄发) -->
            <path d="M30,36 C29,22 39,17 50,17 C61,17 71,22 70,36 C65,28 58,25 50,25 C42,25 35,28 30,36 Z" fill="#1E1B4B" />

            <!-- Forehead Cinnabar Quantum Mark (额间朱砂全息印记) -->
            <circle cx="50" cy="29" r="1.8" fill="#F43F5E" filter="url(#coord-glow)" />

            <!-- Luminous Celestial Eyes (深邃流光星眸) -->
            <ellipse cx="41.5" cy="40.5" rx="2.5" ry="2.8" fill="#1E1B4B" />
            <ellipse cx="41.5" cy="40.5" rx="1.6" ry="1.8" fill="#6366F1" />
            <circle cx="40.8" cy="39.4" r="0.9" fill="#FFFFFF" />
            
            <ellipse cx="58.5" cy="40.5" rx="2.5" ry="2.8" fill="#1E1B4B" />
            <ellipse cx="58.5" cy="40.5" rx="1.6" ry="1.8" fill="#6366F1" />
            <circle cx="57.8" cy="39.4" r="0.9" fill="#FFFFFF" />

            <!-- Serene Smile -->
            <path d="M46,51.5 Q50,54 54,51.5" stroke="#6366F1" stroke-width="1.3" stroke-linecap="round" fill="none" />

            <!-- Dynamic Quantum Core Node on Bottom Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#0F172A" stroke="#38BDF8" stroke-width="1.4" filter="url(#coord-glow)" />
                <circle cx="15" cy="15" r="5" fill="#C084FC" />
                <circle cx="15" cy="15" r="2" fill="#FFFFFF" />
            </g>
        </svg>
        `
    },

    // ========== 7. 人类用户 (东方青年创作者 - 亲切俊秀) ==========
    user: {
        id: 'user',
        title: '您',
        role: '创作者',
        accentColor: '#3B82F6',
        glowColor: 'rgba(59, 130, 246, 0.45)',
        gradient: 'from-blue-500 to-cyan-500',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="usr-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#60A5FA" />
                    <stop offset="60%" stop-color="#2563EB" />
                    <stop offset="100%" stop-color="#1D4ED8" />
                </radialGradient>
                <linearGradient id="usr-hoodie" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="usr-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF5EC" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <linearGradient id="usr-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2D3748" />
                    <stop offset="100%" stop-color="#1A202C" />
                </linearGradient>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#usr-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Clean Modern Hoodie -->
            <path d="M22,96 C24,78 35,69 50,69 C65,69 76,78 78,96 Z" fill="url(#usr-hoodie)" />
            <path d="M42,69 L50,81 L58,69" stroke="#60A5FA" stroke-width="1.3" fill="none" />

            <!-- Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#usr-skin)" />

            <!-- Handsome East Asian Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#usr-skin)" />
            <circle cx="39" cy="45" r="4" fill="#FB923C" opacity="0.2" />
            <circle cx="61" cy="45" r="4" fill="#FB923C" opacity="0.2" />

            <!-- Casual Modern Asian Hair (蓬松自然碎刘海) -->
            <path d="M29,37 C27,24 37,16 50,16 C62,16 71,23 71,35 C65,28 58,25 49,26 C39,27 34,31 29,37 Z" fill="url(#usr-hair)" />
            <path d="M32,32 C36,25 44,25 48,29 C44,31 38,34 33,39 Z" fill="url(#usr-hair)" />
            <path d="M41,20 C47,19 55,21 60,24" stroke="rgba(255,255,255,0.35)" stroke-width="1.1" stroke-linecap="round" fill="none" />

            <!-- Friendly Eyes & Smile -->
            <path d="M37,34 Q41,32 45,34" stroke="#1E293B" stroke-width="1.4" stroke-linecap="round" fill="none" />
            <path d="M55,34 Q59,32 63,34" stroke="#1E293B" stroke-width="1.4" stroke-linecap="round" fill="none" />

            <ellipse cx="41.5" cy="40.5" rx="2.5" ry="2.9" fill="#0F172A" />
            <circle cx="40.7" cy="39.3" r="0.9" fill="#FFFFFF" />
            <circle cx="42.5" cy="41.7" r="0.5" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="58.5" cy="40.5" rx="2.5" ry="2.9" fill="#0F172A" />
            <circle cx="57.7" cy="39.3" r="0.9" fill="#FFFFFF" />
            <circle cx="59.5" cy="41.7" r="0.5" fill="#FFFFFF" opacity="0.8" />

            <!-- Nose & Smile -->
            <path d="M49.5,43 L48.8,46.5 L50.5,46.5" stroke="#D97706" stroke-width="0.8" fill="none" stroke-linecap="round" opacity="0.5" />
            <path d="M46,51.5 Q50,55.5 54,51.5" stroke="#9A3412" stroke-width="1.5" stroke-linecap="round" fill="none" />
        </svg>
        `
    },

    // ========== 8. 辩驳官 (东方批判审查官 - 锐利破局) ==========
    challenger: {
        id: 'challenger',
        title: '辩驳官',
        role: '批判审查与证伪',
        accentColor: '#E11D48',
        glowColor: 'rgba(225, 29, 72, 0.45)',
        gradient: 'from-rose-600 via-red-600 to-amber-700',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="chal-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FB7185" />
                    <stop offset="55%" stop-color="#E11D48" />
                    <stop offset="100%" stop-color="#881337" />
                </radialGradient>
                <linearGradient id="chal-coat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#27272A" />
                    <stop offset="60%" stop-color="#18181B" />
                    <stop offset="100%" stop-color="#09090B" />
                </linearGradient>
                <linearGradient id="chal-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E1E24" />
                    <stop offset="60%" stop-color="#121216" />
                    <stop offset="100%" stop-color="#09090C" />
                </linearGradient>
                <linearGradient id="chal-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF5EC" />
                    <stop offset="100%" stop-color="#FCD5C5" />
                </linearGradient>
                <filter id="chal-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Base Orb -->
            <circle cx="50" cy="50" r="48" fill="url(#chal-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Tactical Radar Crosshair Grid -->
            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.22)" stroke-width="0.9" stroke-dasharray="3,3" fill="none" />
            <line x1="15" y1="50" x2="85" y2="50" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" />
            <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(255,255,255,0.2)" stroke-width="0.8" />

            <!-- Black Tactical Inquisitor High Coat (冷峻审查官风衣) -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#chal-coat)" />
            <!-- Crimson Edge Lapel -->
            <path d="M35,68 L31,58 L42,65 Z" fill="#E11D48" />
            <path d="M65,68 L69,58 L58,65 Z" fill="#E11D48" />

            <!-- Slender Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#chal-skin)" />

            <!-- Sharp Cool Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#chal-skin)" />

            <!-- Sleek Jet-Black Side Bangs (冷峻微卷侧分发) -->
            <path d="M29,37 C27,24 37,16 50,16 C62,16 71,23 71,36 C65,28 58,25 48,26 C38,27 34,31 29,37 Z" fill="url(#chal-hair)" />
            <path d="M31,31 C35,23 44,24 48,29 C45,31 38,34 32,37 Z" fill="url(#chal-hair)" />

            <!-- Tactical Monocle / Weakness Targeter on Left Eye (破绽侦测透镜) -->
            <circle cx="41.5" cy="40.5" r="5.5" fill="none" stroke="#E11D48" stroke-width="1.2" filter="url(#chal-glow)" />
            <line x1="36" y1="40.5" x2="47" y2="40.5" stroke="#E11D48" stroke-width="0.8" />
            <line x1="41.5" y1="35" x2="41.5" y2="46" stroke="#E11D48" stroke-width="0.8" />

            <!-- Sharp Piercing Eyes -->
            <ellipse cx="41.5" cy="40.5" rx="2.2" ry="2.6" fill="#09090B" />
            <circle cx="40.8" cy="39.5" r="0.8" fill="#FFFFFF" />
            
            <ellipse cx="58.5" cy="40.5" rx="2.2" ry="2.6" fill="#09090B" />
            <circle cx="57.8" cy="39.5" r="0.8" fill="#FFFFFF" />

            <!-- Sharp Eyebrows & Critical Smirk -->
            <path d="M36,33 L45,35" stroke="#09090B" stroke-width="1.6" stroke-linecap="round" />
            <path d="M55,35 L64,32.5" stroke="#09090B" stroke-width="1.6" stroke-linecap="round" />
            <path d="M47,52 Q51,51 54,53" stroke="#881337" stroke-width="1.4" stroke-linecap="round" fill="none" />

            <!-- Broken Chain / Falsification Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#18181B" stroke="#E11D48" stroke-width="1.4" filter="url(#chal-glow)" />
                <path d="M9,21 L21,9 M9,9 L21,21" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" />
            </g>
        </svg>
        `
    },

    // ========== 9. 求证者 (东方求真巡检官 - 严密求实) ==========
    evidence_scout: {
        id: 'evidence_scout',
        title: '求证者',
        role: '事实核验与基准',
        accentColor: '#0EA5E9',
        glowColor: 'rgba(14, 165, 233, 0.45)',
        gradient: 'from-sky-500 via-blue-600 to-indigo-700',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="evi-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#7DD3FC" />
                    <stop offset="55%" stop-color="#0EA5E9" />
                    <stop offset="100%" stop-color="#0369A1" />
                </radialGradient>
                <linearGradient id="evi-suit" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B" />
                    <stop offset="60%" stop-color="#0F172A" />
                    <stop offset="100%" stop-color="#020617" />
                </linearGradient>
                <linearGradient id="evi-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#334155" />
                    <stop offset="60%" stop-color="#1E293B" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="evi-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF8F2" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <filter id="evi-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Base Orb -->
            <circle cx="50" cy="50" r="48" fill="url(#evi-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Data Benchmark Axis Lines -->
            <line x1="20" y1="75" x2="80" y2="75" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
            <line x1="25" y1="75" x2="25" y2="25" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
            <path d="M25,65 L45,50 L60,55 L75,35" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" stroke-dasharray="2,2" fill="none" />

            <!-- Modern Scholar Jacket (求真学者制服) -->
            <path d="M22,96 C24,78 35,69 50,69 C65,69 76,78 78,96 Z" fill="url(#evi-suit)" />
            <path d="M44,69 L50,80 L56,69 Z" fill="#38BDF8" opacity="0.9" />

            <!-- Slender Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#evi-skin)" />

            <!-- Gentle Intelligent Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#evi-skin)" />

            <!-- Clean Layered Side Parting Hair (知性整齐侧分发) -->
            <path d="M29,37 C27,24 37,16 50,16 C62,16 71,23 71,36 C65,28 58,25 49,26 C39,27 34,31 29,37 Z" fill="url(#evi-hair)" />
            <path d="M32,33 C37,25 46,25 50,30 C45,32 39,35 34,41 Z" fill="url(#evi-hair)" />

            <!-- Silver Wire Round Spectacles (银丝核验圆眼镜) -->
            <circle cx="41.5" cy="40.5" r="4.8" fill="rgba(255,255,255,0.2)" stroke="#E2E8F0" stroke-width="1" />
            <circle cx="58.5" cy="40.5" r="4.8" fill="rgba(255,255,255,0.2)" stroke="#E2E8F0" stroke-width="1" />
            <line x1="46.3" y1="40.5" x2="53.7" y2="40.5" stroke="#E2E8F0" stroke-width="1" />

            <!-- Clear Attentive Eyes -->
            <ellipse cx="41.5" cy="40.5" rx="2.2" ry="2.6" fill="#0F172A" />
            <circle cx="40.8" cy="39.5" r="0.8" fill="#FFFFFF" />
            <ellipse cx="58.5" cy="40.5" rx="2.2" ry="2.6" fill="#0F172A" />
            <circle cx="57.8" cy="39.5" r="0.8" fill="#FFFFFF" />

            <!-- Calm Smile -->
            <path d="M46.5,52 Q50,54 53.5,52" stroke="#0369A1" stroke-width="1.3" stroke-linecap="round" fill="none" />

            <!-- Data Scroll / Magnifier Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1.4" filter="url(#evi-glow)" />
                <path d="M12,18 L7,23 M17,13 A5,5 0 1,1 12,8 A5,5 0 0,1 17,13 Z" stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" fill="none" />
            </g>
        </svg>
        `
    },

    // ========== 10. 裁判官 (东方终审统筹领航官 - 浑天玉印) ==========
    synthesizer: {
        id: 'synthesizer',
        title: '裁判官',
        role: '跨小队冲突仲裁与终审',
        accentColor: '#D97706',
        glowColor: 'rgba(217, 119, 6, 0.45)',
        gradient: 'from-amber-500 via-orange-600 to-rose-700',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="syn-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FCD34D" />
                    <stop offset="55%" stop-color="#D97706" />
                    <stop offset="100%" stop-color="#78350F" />
                </radialGradient>
                <linearGradient id="syn-robe" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E1B4B" />
                    <stop offset="60%" stop-color="#0F172A" />
                    <stop offset="100%" stop-color="#030712" />
                </linearGradient>
                <linearGradient id="syn-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF9F5" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <filter id="syn-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Base Orb -->
            <circle cx="50" cy="50" r="48" fill="url(#syn-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Golden Armillary Sphere Ring (浑天仪双轨天平金环) -->
            <ellipse cx="50" cy="50" rx="42" ry="16" stroke="rgba(254, 240, 138, 0.6)" stroke-width="1.2" fill="none" transform="rotate(-15 50 50)" />
            <ellipse cx="50" cy="50" rx="42" ry="16" stroke="rgba(251, 146, 60, 0.6)" stroke-width="1.2" fill="none" transform="rotate(15 50 50)" />

            <!-- Imperial Grand Justice Robe (东方威严终审法袍) -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#syn-robe)" />
            <!-- Golden Embroidered V-Trim -->
            <polygon points="50,70 42,62 58,62" fill="#F59E0B" />
            <polygon points="50,78 45,69 55,69" fill="#FDE68A" />

            <!-- Slender Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#syn-skin)" />

            <!-- Noble, Composed Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#syn-skin)" />

            <!-- Majestic Silk Dark Hair (威严束发与流光) -->
            <path d="M30,36 C29,22 39,16 50,16 C61,16 71,22 70,36 C65,28 58,25 50,25 C42,25 35,28 30,36 Z" fill="#18181B" />
            <!-- Golden Guan Crown Pin on Hair -->
            <polygon points="50,14 46,18 54,18" fill="#FBBF24" filter="url(#syn-glow)" />

            <!-- Deep Foresight Eyes (深邃大局观明眸) -->
            <ellipse cx="41.5" cy="40.5" rx="2.5" ry="2.9" fill="#18181B" />
            <circle cx="40.8" cy="39.3" r="0.9" fill="#FFFFFF" />
            <ellipse cx="58.5" cy="40.5" rx="2.5" ry="2.9" fill="#18181B" />
            <circle cx="57.8" cy="39.3" r="0.9" fill="#FFFFFF" />

            <!-- Noble Decisive Expression -->
            <path d="M36,33.5 Q42,32 46,34" stroke="#18181B" stroke-width="1.6" stroke-linecap="round" fill="none" />
            <path d="M54,34 Q58,32 64,33.5" stroke="#18181B" stroke-width="1.6" stroke-linecap="round" fill="none" />
            <path d="M46,52 Q50,54 54,52" stroke="#78350F" stroke-width="1.5" stroke-linecap="round" fill="none" />

            <!-- Jade Gavel / Unified Synthesis Seal Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#451A03" stroke="#FBBF24" stroke-width="1.5" filter="url(#syn-glow)" />
                <polygon points="15,4 19,10 26,11 21,16 22,23 15,19 8,23 9,16 4,11 11,10" fill="#FBBF24" />
                <circle cx="15" cy="14" r="2" fill="#FFFFFF" />
            </g>
        </svg>
        `
    },

    // ========== 11. 智者导师 (东方道骨仙风长者 - 紫气玄玉) ==========
    mentor_sage: {
        id: 'mentor_sage',
        title: '智者导师',
        role: '人生导师与哲学启发',
        accentColor: '#8B5CF6',
        glowColor: 'rgba(139, 92, 246, 0.45)',
        gradient: 'from-purple-500 via-violet-600 to-indigo-700',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="men-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#C084FC" />
                    <stop offset="55%" stop-color="#8B5CF6" />
                    <stop offset="100%" stop-color="#4C1D95" />
                </radialGradient>
                <linearGradient id="men-robe" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#312E81" />
                    <stop offset="60%" stop-color="#1E1B4B" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="men-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFFDF9" />
                    <stop offset="100%" stop-color="#FDE8D7" />
                </linearGradient>
                <linearGradient id="men-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#E2E8F0" />
                    <stop offset="40%" stop-color="#64748B" />
                    <stop offset="100%" stop-color="#1E293B" />
                </linearGradient>
                <filter id="men-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#men-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Cloud / Taiji Mist Lines -->
            <path d="M15,40 Q30,30 50,40 T85,40" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4,3" fill="none" />
            <path d="M15,70 Q35,60 50,70 T85,70" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4,3" fill="none" />

            <!-- Elegant Daoist Violet Robe -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#men-robe)" />
            <path d="M40,68 L50,82 L60,68" stroke="#A78BFA" stroke-width="1.8" fill="none" />
            <polygon points="50,82 46,75 54,75" fill="#34D399" />

            <!-- Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#men-skin)" />

            <!-- Wise, Kind Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#men-skin)" />

            <!-- Silver Streaked Elegant Sage Hair with Topknot -->
            <path d="M29,38 C27,24 37,16 50,16 C63,16 71,23 71,36 C66,27 58,24 49,25 C39,26 33,31 29,38 Z" fill="url(#men-hair)" />
            <!-- Topknot & Jade Hairpin -->
            <ellipse cx="50" cy="14" rx="8" ry="6" fill="#475569" />
            <line x1="38" y1="13" x2="62" y2="13" stroke="#34D399" stroke-width="2.2" stroke-linecap="round" filter="url(#men-glow)" />

            <!-- Wise Smile Lines & Brow -->
            <path d="M36,34 Q42,32 46,34" stroke="#475569" stroke-width="1.4" stroke-linecap="round" fill="none" />
            <path d="M54,34 Q58,32 64,34" stroke="#475569" stroke-width="1.4" stroke-linecap="round" fill="none" />

            <!-- Gentle Smiling Eyes (慈和长者笑眸) -->
            <path d="M38,40 Q42,37 46,41" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" fill="none" />
            <path d="M54,41 Q58,37 62,40" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" fill="none" />

            <!-- Warm smile -->
            <path d="M45,51.5 Q50,55 55,51.5" stroke="#7C3AED" stroke-width="1.5" stroke-linecap="round" fill="none" />

            <!-- Jade Taiji Scroll Seal on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#1E1B4B" stroke="#A78BFA" stroke-width="1.5" filter="url(#men-glow)" />
                <circle cx="15" cy="15" r="8" fill="#34D399" opacity="0.8" />
                <path d="M15,7 A8,8 0 0,0 15,23 A4,4 0 0,1 15,15 A4,4 0 0,0 15,7 Z" fill="#FFFFFF" />
            </g>
        </svg>
        `
    },

    // ========== 12. 理性分析专家 (东方量化数理专家 - 湛蓝视界) ==========
    analytic_expert: {
        id: 'analytic_expert',
        title: '理性分析专家',
        role: '逻辑推演与数据决策',
        accentColor: '#0EA5E9',
        glowColor: 'rgba(14, 165, 233, 0.45)',
        gradient: 'from-sky-500 via-blue-600 to-indigo-800',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="ana-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#38BDF8" />
                    <stop offset="55%" stop-color="#0284C7" />
                    <stop offset="100%" stop-color="#075985" />
                </radialGradient>
                <linearGradient id="ana-suit" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B" />
                    <stop offset="70%" stop-color="#0F172A" />
                    <stop offset="100%" stop-color="#020617" />
                </linearGradient>
                <linearGradient id="ana-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFFFFF" />
                    <stop offset="100%" stop-color="#FDE8D7" />
                </linearGradient>
                <filter id="ana-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#ana-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Quant Matrix Grid Lines -->
            <path d="M20,20 L80,80 M80,20 L20,80 M50,10 L50,90 M10,50 L90,50" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" stroke-dasharray="2,2" fill="none" />

            <!-- High-Tech Navy Suit -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#ana-suit)" />
            <!-- Shirt & Tie -->
            <polygon points="50,68 44,78 56,78" fill="#F8FAFC" />
            <polygon points="50,73 47,90 53,90" fill="#0284C7" />

            <!-- Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#ana-skin)" />

            <!-- Sharp Analytical Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#ana-skin)" />

            <!-- Refined Sleek Side-part Black Hair (干练侧分黑发) -->
            <path d="M30,36 C28,23 38,16 50,16 C62,16 70,22 70,35 C64,28 56,25 48,26 C38,27 34,31 30,36 Z" fill="#0F172A" />
            <path d="M32,30 C37,23 45,24 49,28 C45,30 38,33 33,37 Z" fill="#1E293B" />

            <!-- Titanium Rectangular Glasses (超轻矩形商务眼镜) -->
            <rect x="36" y="37" width="12" height="7" rx="1.5" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" stroke-width="1.2" />
            <rect x="52" y="37" width="12" height="7" rx="1.5" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" stroke-width="1.2" />
            <line x1="48" y1="40.5" x2="52" y2="40.5" stroke="#38BDF8" stroke-width="1.2" />

            <!-- Intense Focused Eyes -->
            <ellipse cx="42" cy="40.5" rx="2" ry="2.4" fill="#0F172A" />
            <circle cx="41.3" cy="39.5" r="0.7" fill="#38BDF8" />
            <ellipse cx="58" cy="40.5" rx="2" ry="2.4" fill="#0F172A" />
            <circle cx="57.3" cy="39.5" r="0.7" fill="#38BDF8" />

            <!-- Composed mouth -->
            <path d="M46,52 L54,52" stroke="#0369A1" stroke-width="1.5" stroke-linecap="round" />

            <!-- Bar Chart & Hologram Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#082F49" stroke="#38BDF8" stroke-width="1.5" filter="url(#ana-glow)" />
                <rect x="7" y="17" width="3" height="6" fill="#38BDF8" />
                <rect x="12" y="12" width="3" height="11" fill="#38BDF8" />
                <rect x="17" y="8" width="3" height="15" fill="#34D399" />
            </g>
        </svg>
        `
    },

    // ========== 13. 创意创新者 (东方前沿数字艺术家 - 炽阳极彩) ==========
    creative_innovator: {
        id: 'creative_innovator',
        title: '创意创新者',
        role: '破局灵感与思维发散',
        accentColor: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.45)',
        gradient: 'from-amber-400 via-orange-500 to-rose-600',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="cre-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FDE68A" />
                    <stop offset="50%" stop-color="#F59E0B" />
                    <stop offset="100%" stop-color="#D97706" />
                </radialGradient>
                <linearGradient id="cre-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#7C2D12" />
                    <stop offset="50%" stop-color="#C2410C" />
                    <stop offset="100%" stop-color="#1E1B4B" />
                </linearGradient>
                <linearGradient id="cre-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFFDF5" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <filter id="cre-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#cre-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Sparks / Dynamic Idea Constellation -->
            <circle cx="25" cy="28" r="2.5" fill="#FFFFFF" filter="url(#cre-glow)" />
            <polygon points="75,22 77,27 82,27 78,30 80,35 75,32 70,35 72,30 68,27 73,27" fill="#FDE68A" filter="url(#cre-glow)" />

            <!-- Asymmetric Cyber Streetwear Jacket -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#cre-jacket)" />
            <path d="M35,68 L48,82 L42,96" stroke="#FDE68A" stroke-width="2" fill="none" />

            <!-- Slender Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#cre-skin)" />

            <!-- Dynamic Animated Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#cre-skin)" />
            <circle cx="38" cy="46" r="4" fill="#FB923C" opacity="0.35" />
            <circle cx="62" cy="46" r="4" fill="#FB923C" opacity="0.35" />

            <!-- Trendy Two-Tone Wolf Cut Hair (前卫挑染黑金狼尾发) -->
            <path d="M28,38 C26,24 36,15 50,15 C64,15 72,23 72,37 C66,27 58,23 48,24 C38,25 33,30 28,38 Z" fill="#18181B" />
            <!-- Neon Sunset Highlight Strands (炽金挑染) -->
            <path d="M33,30 C38,22 46,23 49,28 C45,31 38,33 33,37 Z" fill="#F59E0B" />
            <path d="M49,25 C55,21 64,23 68,32 C64,30 57,30 51,27 Z" fill="#F43F5E" />

            <!-- Expressive Inspired Eyes -->
            <ellipse cx="41.5" cy="40.5" rx="2.6" ry="3" fill="#18181B" />
            <polygon points="41.5,38 42.5,40 44,40 43,41.5 43.5,43 41.5,42 39.5,43 40,41.5 39,40 40.5,40" fill="#FDE68A" />
            <ellipse cx="58.5" cy="40.5" rx="2.6" ry="3" fill="#18181B" />
            <polygon points="58.5,38 59.5,40 61,40 60,41.5 60.5,43 58.5,42 56.5,43 57,41.5 56,40 57.5,40" fill="#FDE68A" />

            <!-- Confident Playful Smile -->
            <path d="M45,51 Q50,56 55,51" stroke="#C2410C" stroke-width="1.8" stroke-linecap="round" fill="none" />

            <!-- Lightbulb / Spark Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#451A03" stroke="#FBBF24" stroke-width="1.5" filter="url(#cre-glow)" />
                <path d="M15,6 C11,6 8,9 8,13 C8,16 10,18 12,20 L18,20 C20,18 22,16 22,13 C22,9 19,6 15,6 Z" fill="#FBBF24" />
                <rect x="12" y="21" width="6" height="2" rx="1" fill="#FFFFFF" />
            </g>
        </svg>
        `
    },

    // ========== 14. 行动教练 (东方敏捷体能领队 - 极速青锋) ==========
    action_coach: {
        id: 'action_coach',
        title: '行动教练',
        role: '高效推进与执行督导',
        accentColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        gradient: 'from-emerald-400 via-green-500 to-teal-700',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="act-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#6EE7B7" />
                    <stop offset="55%" stop-color="#10B981" />
                    <stop offset="100%" stop-color="#065F46" />
                </radialGradient>
                <linearGradient id="act-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#064E3B" />
                    <stop offset="60%" stop-color="#022C22" />
                    <stop offset="100%" stop-color="#0F172A" />
                </linearGradient>
                <linearGradient id="act-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFF8F0" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <filter id="act-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#act-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Speed Stripes / Milestone Vectors -->
            <path d="M15,25 L35,25 M10,35 L40,35 M15,75 L45,75" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" fill="none" />

            <!-- High-collar Athletic Coach Windbreaker -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#act-jacket)" />
            <path d="M50,68 L50,96" stroke="#34D399" stroke-width="2" />
            <path d="M38,68 L32,80 M62,68 L68,80" stroke="#6EE7B7" stroke-width="1.5" />

            <!-- Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#act-skin)" />

            <!-- Determined Handsome Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#act-skin)" />

            <!-- Sporty Spiky Modern Asian Hair (清爽微翘运动短发) -->
            <path d="M28,36 C26,22 36,15 50,15 C64,15 72,22 72,36 C66,27 58,23 48,24 C38,25 33,30 28,36 Z" fill="#0F172A" />
            <polygon points="35,16 38,11 43,15" fill="#0F172A" />
            <polygon points="46,14 50,9 55,14" fill="#0F172A" />
            <polygon points="57,15 62,11 65,16" fill="#0F172A" />

            <!-- Headband / Smart Visor -->
            <path d="M32,28 C42,25 58,25 68,28" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" fill="none" />

            <!-- Energetic Focused Eyes -->
            <path d="M36,34 Q42,32 46,34" stroke="#0F172A" stroke-width="1.6" stroke-linecap="round" fill="none" />
            <path d="M54,34 Q58,32 64,34" stroke="#0F172A" stroke-width="1.6" stroke-linecap="round" fill="none" />

            <ellipse cx="41.5" cy="40.5" rx="2.5" ry="2.8" fill="#0F172A" />
            <circle cx="41" cy="39.5" r="0.8" fill="#FFFFFF" />
            <ellipse cx="58.5" cy="40.5" rx="2.5" ry="2.8" fill="#0F172A" />
            <circle cx="58" cy="39.5" r="0.8" fill="#FFFFFF" />

            <!-- Determined Motivating Smile -->
            <path d="M45,51.5 Q50,54.5 55,51.5" stroke="#065F46" stroke-width="1.8" stroke-linecap="round" fill="none" />

            <!-- Stopwatch / Target Checklist Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#064E3B" stroke="#34D399" stroke-width="1.5" filter="url(#act-glow)" />
                <circle cx="15" cy="15" r="8" stroke="#34D399" stroke-width="1.2" fill="none" />
                <polyline points="15,10 15,15 18,17" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" fill="none" />
            </g>
        </svg>
        `
    },

    // ========== 15. 共情陪伴者 (东方温柔疗愈使者 - 樱落暖阳) ==========
    empathy_companion: {
        id: 'empathy_companion',
        title: '共情陪伴者',
        role: '暖心倾听与情感支持',
        accentColor: '#EC4899',
        glowColor: 'rgba(236, 72, 153, 0.45)',
        gradient: 'from-pink-400 via-rose-500 to-purple-600',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="emp-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#FBCFE8" />
                    <stop offset="55%" stop-color="#EC4899" />
                    <stop offset="100%" stop-color="#9D174D" />
                </radialGradient>
                <linearGradient id="emp-sweater" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FDF2F8" />
                    <stop offset="60%" stop-color="#FCE7F3" />
                    <stop offset="100%" stop-color="#FBCFE8" />
                </linearGradient>
                <linearGradient id="emp-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFFDF9" />
                    <stop offset="100%" stop-color="#FED7AA" />
                </linearGradient>
                <linearGradient id="emp-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3F2D24" />
                    <stop offset="100%" stop-color="#1F1612" />
                </linearGradient>
                <filter id="emp-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#emp-bg)" />
            <circle cx="50" cy="50" r="47" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" fill="none" />

            <!-- Floating Sakura Petals / Soft Heart Rays -->
            <path d="M22,25 Q25,20 28,25 Q25,30 22,25 Z" fill="#FFFFFF" opacity="0.6" filter="url(#emp-glow)" />
            <path d="M78,35 Q81,30 84,35 Q81,40 78,35 Z" fill="#FFFFFF" opacity="0.6" filter="url(#emp-glow)" />

            <!-- Soft Cozy Knit Sweater (温柔高领羊绒毛衣) -->
            <path d="M22,96 C24,78 35,68 50,68 C65,68 76,78 78,96 Z" fill="url(#emp-sweater)" />
            <path d="M42,68 C42,62 58,62 58,68" stroke="#F472B6" stroke-width="2" fill="none" />

            <!-- Delicate Neck -->
            <rect x="45" y="55" width="10" height="12" rx="3" fill="url(#emp-skin)" />

            <!-- Soft Porcelain Oval Face -->
            <path d="M33,38 C33,26 40,22 50,22 C60,22 67,26 67,38 C67,50 59,59 50,60 C41,59 33,50 33,38 Z" fill="url(#emp-skin)" />
            <!-- Warm Rosy Cheek Blush -->
            <ellipse cx="38" cy="46" rx="4.5" ry="3" fill="#F43F5E" opacity="0.3" />
            <ellipse cx="62" cy="46" rx="4.5" ry="3" fill="#F43F5E" opacity="0.3" />

            <!-- Gentle Dark Chestnut Wavy Bob Hair (柔顺栗黑微卷发) -->
            <path d="M28,36 C26,22 36,15 50,15 C64,15 72,22 72,36 C70,48 68,52 66,54 C64,48 64,36 64,32 C58,26 42,26 36,32 C36,36 36,48 34,54 C32,52 30,48 28,36 Z" fill="url(#emp-hair)" />
            <path d="M36,28 C42,22 58,22 64,28" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" stroke-linecap="round" fill="none" />

            <!-- Soft Crescent Smiling Eyes (温柔新月笑眸) -->
            <path d="M37,39 Q41.5,35 46,39.5" stroke="#4A044E" stroke-width="1.8" stroke-linecap="round" fill="none" />
            <path d="M54,39.5 Q58.5,35 63,39" stroke="#4A044E" stroke-width="1.8" stroke-linecap="round" fill="none" />

            <!-- Healing Warm Smile -->
            <path d="M45,51.5 Q50,56 55,51.5" stroke="#BE185D" stroke-width="1.6" stroke-linecap="round" fill="none" />

            <!-- Floating Origami Heart Crane Emblem on Corner -->
            <g transform="translate(66, 62) scale(0.65)">
                <circle cx="15" cy="15" r="14" fill="#831843" stroke="#F472B6" stroke-width="1.5" filter="url(#emp-glow)" />
                <path d="M15,9 C12,5 7,7 7,12 C7,17 15,23 15,23 C15,23 23,17 23,12 C23,7 18,5 15,9 Z" fill="#F472B6" />
            </g>
        </svg>
        `
    },

    // ========== 16. 质检官 (东方严谨质量与合规总监 - 钛金严谨卡尺/质检印章/青金石立领正装) ==========
    quality_inspector: {
        id: 'quality_inspector',
        title: '质检官',
        role: '质量门禁与一致性审查',
        accentColor: '#0D9488',
        glowColor: 'rgba(13, 148, 136, 0.55)',
        gradient: 'from-teal-600 via-emerald-600 to-cyan-800',
        svgContent: `
        <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="qi-bg" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="#14B8A6" />
                    <stop offset="60%" stop-color="#0F766E" />
                    <stop offset="100%" stop-color="#042F2E" />
                </radialGradient>
                <linearGradient id="qi-suit" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#134E4A" />
                    <stop offset="50%" stop-color="#042F2E" />
                    <stop offset="100%" stop-color="#021E1D" />
                </linearGradient>
                <linearGradient id="qi-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1E293B" />
                    <stop offset="70%" stop-color="#0F172A" />
                    <stop offset="100%" stop-color="#020617" />
                </linearGradient>
                <linearGradient id="qi-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#FFFDF5" />
                    <stop offset="100%" stop-color="#FDE8D0" />
                </linearGradient>
                <filter id="qi-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#14B8A6" flood-opacity="0.6" />
                </filter>
            </defs>

            <!-- 3D Spherical Background -->
            <rect width="100" height="100" rx="24" fill="url(#qi-bg)" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#2DD4BF" stroke-width="1.5" opacity="0.4" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

            <!-- Shoulders & Standing Mandarin Collar Suit (严谨青金立领工装) -->
            <path d="M18,92 C20,72 34,65 50,65 C66,65 80,72 82,92 Z" fill="url(#qi-suit)" />
            <path d="M42,65 L50,75 L58,65 Z" fill="#F8FAFC" opacity="0.95" />
            <path d="M48,74 L50,92 L52,74 Z" fill="#0D9488" />
            <!-- Titanium Metric Badge -->
            <rect x="36" y="76" width="6" height="10" rx="1.5" fill="#2DD4BF" opacity="0.8" />

            <!-- Composed Neck -->
            <rect x="44" y="52" width="12" height="15" rx="3" fill="url(#qi-skin)" />

            <!-- Refined Symmetrical Face (严谨方正秀雅脸型) -->
            <path d="M32,36 C32,22 40,19 50,19 C60,19 68,22 68,36 C68,50 60,59 50,60 C40,59 32,50 32,36 Z" fill="url(#qi-skin)" />

            <!-- Neat Structured Parted Hair (一丝不苟三七分干练短发) -->
            <path d="M28,34 C28,18 38,13 50,13 C62,13 72,18 72,34 C72,42 70,48 68,50 C66,42 66,32 58,26 C50,22 40,24 34,30 C30,34 30,42 28,34 Z" fill="url(#qi-hair)" />
            <path d="M38,18 C46,15 56,16 64,20" stroke="rgba(255,255,255,0.3)" stroke-width="1.2" stroke-linecap="round" fill="none" />

            <!-- Sharp Titanium Frame Glasses (钛合金微方框质检眼镜) -->
            <rect x="34" y="34" width="13" height="9" rx="2" fill="rgba(20,184,166,0.18)" stroke="#2DD4BF" stroke-width="1.2" />
            <rect x="53" y="34" width="13" height="9" rx="2" fill="rgba(20,184,166,0.18)" stroke="#2DD4BF" stroke-width="1.2" />
            <line x1="47" y1="38" x2="53" y2="38" stroke="#2DD4BF" stroke-width="1.2" />

            <!-- Keen Inspecting Eyes behind Glasses -->
            <ellipse cx="40.5" cy="38.5" rx="2.5" ry="3" fill="#042F2E" />
            <circle cx="39.8" cy="37.5" r="0.8" fill="#FFFFFF" />
            <circle cx="41.3" cy="39.5" r="0.4" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="59.5" cy="38.5" rx="2.5" ry="3" fill="#042F2E" />
            <circle cx="58.8" cy="37.5" r="0.8" fill="#FFFFFF" />
            <circle cx="60.3" cy="39.5" r="0.4" fill="#FFFFFF" opacity="0.8" />

            <!-- Rigorous Straight Eyebrows (严谨一字平眉) -->
            <line x1="34" y1="31" x2="46" y2="31" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
            <line x1="54" y1="31" x2="66" y2="31" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />

            <!-- Nose & Resolute Composed Mouth -->
            <path d="M49.5,41 L48.8,45 L51,45" stroke="#0D9488" stroke-width="1" fill="none" stroke-linecap="round" />
            <line x1="46" y1="51.5" x2="54" y2="51.5" stroke="#0F766E" stroke-width="1.6" stroke-linecap="round" />

            <!-- Holographic Verification Seal Emblem (全息合格质检印章徽标) -->
            <g transform="translate(64, 60) scale(0.68)">
                <circle cx="16" cy="16" r="14" fill="#042F2E" stroke="#2DD4BF" stroke-width="1.5" filter="url(#qi-glow)" />
                <path d="M10,16 L14,20 L22,11" stroke="#5EEAD4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="#2DD4BF" stroke-width="0.8" stroke-dasharray="2 2" />
            </g>
        </svg>
        `
    }
};

/**
 * 获取指定 Agent 的 3D 拟人化头像资产
 * 严格遵循 MECE 原则：每个 Agent 与 Persona 均拥有独一无二的专属形象
 */
export function getAgentAvatar(agentIdOrAvatar?: string): AvatarSpec {
    if (!agentIdOrAvatar) return AGENT_AVATARS['decomposer'];

    const normalized = agentIdOrAvatar.toLowerCase().trim();

    // 1. Exact ID match (MECE First-Class)
    if (AGENT_AVATARS[normalized]) {
        return AGENT_AVATARS[normalized];
    }

    // 2. Strict Deterministic Alias Mapping (No Overlaps)
    if (normalized.includes('quality_inspector') || normalized.includes('质检官') || normalized.includes('inspector') || normalized.includes('audit') || normalized.includes('qa') || normalized.includes('quality')) {
        return AGENT_AVATARS['quality_inspector'];
    }
    if (normalized.includes('mentor_sage') || normalized.includes('builtin_mentor_agent') || normalized.includes('智者导师') || normalized.includes('sage') || normalized.includes('mentor')) {
        return AGENT_AVATARS['mentor_sage'];
    }
    if (normalized.includes('analytic_expert') || normalized.includes('builtin_analyst_agent') || normalized.includes('理性分析') || normalized.includes('analyst') || normalized.includes('analytic')) {
        return AGENT_AVATARS['analytic_expert'];
    }
    if (normalized.includes('creative_innovator') || normalized.includes('创意创新') || normalized.includes('innovat') || normalized.includes('creative')) {
        return AGENT_AVATARS['creative_innovator'];
    }
    if (normalized.includes('action_coach') || normalized.includes('builtin_coach_agent') || normalized.includes('行动教练') || normalized.includes('coach')) {
        return AGENT_AVATARS['action_coach'];
    }
    if (normalized.includes('empathy_companion') || normalized.includes('共情陪伴') || normalized.includes('empathy') || normalized.includes('companion')) {
        return AGENT_AVATARS['empathy_companion'];
    }
    if (normalized.includes('challenger') || normalized.includes('辩驳官') || normalized.includes('杠精') || normalized.includes('falsif') || normalized.includes('critic') || normalized.includes('red_team')) {
        return AGENT_AVATARS['challenger'];
    }
    if (normalized.includes('evidence_scout') || normalized.includes('求证者') || normalized.includes('scout') || normalized.includes('fact') || normalized.includes('benchmark')) {
        return AGENT_AVATARS['evidence_scout'];
    }
    if (normalized.includes('synthesizer') || normalized.includes('裁判官') || normalized.includes('arbiter') || normalized.includes('judge') || normalized.includes('裁决')) {
        return AGENT_AVATARS['synthesizer'];
    }
    if (normalized.includes('decomposer') || normalized.includes('拆局者') || normalized.includes('decompos') || normalized.includes('拆解')) {
        return AGENT_AVATARS['decomposer'];
    }
    if (normalized.includes('calculator') || normalized.includes('算账的') || normalized.includes('calc') || normalized.includes('算账') || normalized.includes('精算')) {
        return AGENT_AVATARS['calculator'];
    }
    if (normalized.includes('pathfinder') || normalized.includes('找路的') || normalized.includes('path') || normalized.includes('找路') || normalized.includes('探索')) {
        return AGENT_AVATARS['pathfinder'];
    }
    if (normalized.includes('stress_tester') || normalized.includes('兜底的') || normalized.includes('stress') || normalized.includes('兜底') || normalized.includes('风控')) {
        return AGENT_AVATARS['stress_tester'];
    }
    if (normalized.includes('closer') || normalized.includes('收网的') || normalized.includes('close') || normalized.includes('收网') || normalized.includes('落地')) {
        return AGENT_AVATARS['closer'];
    }
    if (normalized.includes('coordinator') || normalized.includes('协调') || normalized.includes('thought') || normalized.includes('system') || normalized.includes('orchestrat')) {
        return AGENT_AVATARS['coordinator'];
    }
    if (normalized.includes('user') || normalized.includes('human') || normalized.includes('用户') || normalized.includes('creator')) {
        return AGENT_AVATARS['user'];
    }

    // Default fallback to decomposer
    return AGENT_AVATARS['decomposer'];
}



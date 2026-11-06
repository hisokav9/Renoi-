// Tout le texte du portfolio est ici : modifiez ce fichier pour changer le contenu.

export const contact = {
  name: 'Samir Abdoulaye Seyni',
  short: 'Samir',
  city: 'Dosso, Niger',
  whatsapp: '22789465956',
  whatsappLabel: '+227 89 46 59 56',
  email: 'samirofficiel32@gmail.com',
  tiktok: 'https://www.tiktok.com/@renoi_dev',
  tiktokHandle: '@renoi_dev',
  renoi: 'https://renoistudio.netlify.app',
  selvDigital: 'https://selvdigital.mychariow.shop',
  selvStudio: 'https://selv-studio.netlify.app',
}

export const waLink = (text?: string) =>
  `https://wa.me/${contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const nav = [
  { label: 'Projets', href: '#projets' },
  { label: 'Services', href: '#services' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'À propos', href: '#apropos' },
  { label: 'FAQ', href: '#faq' },
]

export const stats = [
  { value: 16.8, decimals: 1, suffix: ' K', label: 'abonnés sur TikTok, où je montre comment je construis' },
  { value: 10, decimals: 0, suffix: '+', label: 'projets construits : sites 3D, boutiques, applis, bots, un jeu' },
  { value: 225, decimals: 0, suffix: '', label: 'clients sur ma boutique Selv Digital' },
  { value: 100, decimals: 0, suffix: ' %', label: "d'avis positifs de mes clients" },
]

export const skills = [
  'Sites 3D',
  'Landing pages',
  'Boutiques en ligne',
  'Applis web & IA',
  'Bots Telegram',
  'Automatisation',
  'Vidéos pub',
  'Affiches',
  'Textes qui vendent',
]

export const manifesto =
  "Un seul interlocuteur, du premier message à la mise en ligne. Je dessine, je code, j'écris les textes et je monte les vidéos qui ramènent vos clients. Pas d'agence, pas d'intermédiaire : vous parlez à celui qui construit."

export const manifestoHighlights = ['seul', 'interlocuteur', 'dessine,', 'code,', 'textes', 'vidéos', 'construit.']

export type Project = {
  name: string
  badge: string
  kind: string
  desc: string
  stack: string[]
  motif: 'road' | 'dunes' | 'radar' | 'quiz' | 'swirl'
  hue: string
  link?: string
  /** Capture du projet (ex. '/img/niamey-cars.webp' dans le dossier public/img). Sans image, une illustration animée s'affiche. */
  image?: string
}

export const featured = {
  name: 'Renoi Studio',
  badge: 'Projet phare',
  desc: "Le site de mon studio. Une carte du Niger zoome jusqu'à une mosquée en banco modélisée en 3D, puis dévoile les offres. Assistante IA intégrée et tableau de bord privé pour modifier le contenu.",
  stack: ['Three.js', 'ArcGIS', 'Assistante IA', 'Decap CMS', 'Netlify'],
  image: '/img/renoi-studio.webp',
  link: contact.renoi,
}

export const projects: Project[] = [
  {
    name: 'Niamey Cars',
    badge: 'Démo',
    kind: 'Showroom 3D',
    desc: "Showroom automobile en 3D pour un concessionnaire de Niamey. Les voitures tournent pendant qu'on fait défiler.",
    stack: ['Three.js', 'Modèles 3D', 'WhatsApp'],
    motif: 'road',
    hue: '#FF7A2F',
  },
  {
    name: 'TÉNÉRÉ',
    badge: 'Démo',
    kind: 'Mode · e-commerce',
    desc: "Boutique de mode nigérienne haut de gamme. La caméra avance dans un showroom 3D jusqu'aux vêtements.",
    stack: ['React', 'React Three Fiber', 'GSAP'],
    motif: 'dunes',
    hue: '#F2B544',
  },
  {
    name: 'Fada Royale',
    badge: 'Version 0.4',
    kind: 'Jeu web 3D',
    desc: 'Jeu battle royale en 3D aux couleurs du Niger : Niamey, Agadez, Zinder et Maradi.',
    stack: ['Three.js', 'Jeu navigateur'],
    motif: 'radar',
    hue: '#E8463A',
  },
  {
    name: 'BacForce',
    badge: 'En vente',
    kind: 'Appli IA',
    desc: "Appli de révision pour le Bac D : plus de 150 QCM, 7 matières, annales corrigées et un générateur d'exercices par IA.",
    stack: ['React', 'IA'],
    motif: 'quiz',
    hue: '#7C9CFF',
  },
  {
    name: 'Mvkebaa',
    badge: 'Projet client',
    kind: 'Précommande',
    desc: 'Site de précommande pour une pâtisserie. Les commandes arrivent directement dans Google Sheets, consultables sur téléphone.',
    stack: ['HTML', 'Google Sheets', 'Netlify'],
    motif: 'swirl',
    hue: '#F29BB0',
  },
]

export const alsoLive = [
  { name: 'Selv Digital', status: 'En ligne', desc: 'Ma boutique de produits digitaux sur Chariow : guides et applis de révision.', link: contact.selvDigital },
  { name: 'Selv Studio', status: 'En ligne', desc: "Commande de vidéos pub et d'affiches en 6 étapes, confirmée sur WhatsApp.", link: contact.selvStudio },
  { name: 'SELV Motion', status: 'En chantier', desc: 'Thème Shopify qui donne à chaque produit sa propre animation.' },
  { name: 'Social Quality Bot', status: 'En chantier', desc: "Bot Telegram qui améliore vos photos et vidéos grâce à l'IA." },
]

export const concepts = [
  { name: 'Mode', brand: 'koura', url: 'koura-atelier.com', title: 'La nouvelle collection', cta: 'Découvrir', image: '/img/concept-mode.webp', pos: '50% 30%' },
  { name: 'Restaurant', brand: 'Table 227', url: 'table227.com', title: 'Cuisine de saison, service à la bougie', cta: 'Réserver une table', image: '/img/concept-restaurant.webp', pos: '64% 50%' },
  { name: 'Immobilier', brand: 'Horizon', url: 'horizon-immo.com', title: 'Trouvez la maison qui vous ressemble', cta: 'Chercher', image: '/img/concept-immobilier.webp', pos: '68% 50%' },
  { name: 'Start-up tech', brand: 'fibre', url: 'fibre.app', title: 'Vos outils, enfin connectés', cta: 'Essayer', image: '/img/concept-tech.webp', pos: '62% 50%' },
  { name: 'Boutique en ligne', brand: 'obsidienne', url: 'obsidienne.shop', title: 'Eau de parfum, flacon noir', cta: 'Ajouter au panier', image: '/img/concept-boutique.webp', pos: '50% 50%' },
  { name: 'Marque personnelle', brand: 'Votre nom', url: 'votrenom.com', title: 'Votre expertise, enfin visible', cta: 'Prendre rendez-vous', image: '/img/concept-marque.webp', pos: '50% 25%' },
]

export type Service = {
  title: string
  desc: string
  tags: string[]
  price: string
  icon: 'globe' | 'bag' | 'sparkles' | 'bot' | 'clapperboard' | 'pen'
  lines?: [string, string][]
  link?: { label: string; href: string }
  wide?: boolean
}

export const services: Service[] = [
  {
    title: 'Site vitrine ou landing page',
    desc: "Un site rapide, beau sur téléphone, avec des animations qui marquent. De la 3D quand votre activité s'y prête.",
    tags: ['Design sur mesure', 'Bouton WhatsApp', 'Hébergement offert 1 an'],
    price: 'À partir de 150 000 FCFA',
    icon: 'globe',
    wide: true,
  },
  {
    title: 'Boutique en ligne',
    desc: "Sur Shopify ou Chariow, avec des pages produit qui donnent envie d'acheter et la commande par WhatsApp.",
    tags: ['Fiches produit', 'Textes de vente', 'Commande WhatsApp'],
    price: 'Sur devis',
    icon: 'bag',
  },
  {
    title: 'Appli web et outil IA',
    desc: "Une appli qui tourne dans le navigateur, comme BacForce. Avec de l'IA quand elle apporte vraiment quelque chose.",
    tags: ['Fonctionne sur téléphone', 'IA intégrée'],
    price: 'Sur devis',
    icon: 'sparkles',
  },
  {
    title: 'Bot Telegram et automatisation',
    desc: 'Prise de commande, réponses automatiques, suivi dans Google Sheets. Le travail répétitif se fait tout seul.',
    tags: ['Telegram', 'Google Sheets', 'Formulaires'],
    price: 'Sur devis',
    icon: 'bot',
  },
  {
    title: 'Vidéo pub et affiche',
    desc: 'Vidéos courtes pour TikTok, Facebook et le statut WhatsApp, montées par moi, sans sous-traitance.',
    tags: ['TikTok', 'Facebook', 'Statut WhatsApp'],
    price: 'Packs dès 2 000 FCFA',
    icon: 'clapperboard',
    lines: [
      ['1 vidéo', '2 000 FCFA'],
      ['Pack 3 vidéos', '5 000 FCFA'],
      ['Pack 5 vidéos', '10 000 FCFA'],
      ['Affiche', '1 000 FCFA'],
    ],
    link: { label: 'Commander sur Selv Studio', href: contact.selvStudio },
  },
  {
    title: 'Textes qui vendent',
    desc: 'Pages de vente, descriptions produit, publicités Facebook. Écrits pour vos clients, dans leurs mots.',
    tags: ['Pages de vente', 'Pubs Facebook', 'Fiches produit'],
    price: 'Sur devis',
    icon: 'pen',
  },
]

export const proof = {
  title: 'Je sais vendre en ligne. Je le fais pour moi.',
  intro:
    "Selv Digital, c'est ma propre boutique de guides et d'applis sur Chariow. Je l'ai construite de A à Z : les produits, les visuels, les pages de vente et le paiement Mobile Money. Ce que je fais pour vous, je l'ai d'abord testé sur mon propre business.",
  numbers: [
    { value: 225, suffix: '', label: 'clients' },
    { value: 100, suffix: ' %', label: "d'avis positifs" },
    { value: 118, suffix: '', label: 'ventes pour un seul guide' },
  ],
  link: contact.selvDigital,
}

export type Plan = {
  name: string
  price: string
  unit?: string
  pitch: string
  features: string[]
  delay: string
  rounds: string
  featured?: boolean
}

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: '150 000',
    unit: 'FCFA',
    pitch: "Une page, jusqu'à 5 sections.",
    features: ['Mise en page soignée à partir de votre contenu', 'Boutons WhatsApp', 'Version mobile', 'Bases du référencement (SEO)', 'Mise en ligne'],
    delay: '1 à 2 semaines',
    rounds: '1 série',
  },
  {
    name: 'Signature',
    price: '300 000',
    unit: 'FCFA',
    pitch: 'Tout Starter, plus :',
    features: ["Jusqu'à 5 pages", 'Direction artistique', 'Maquettes validées avant le code', 'Animations'],
    delay: '3 à 4 semaines',
    rounds: '2 séries',
    featured: true,
  },
  {
    name: 'Cinematic',
    price: '600 000',
    unit: 'FCFA',
    pitch: 'Tout Signature, plus :',
    features: ['Animations au défilement', '3D quand elle sert le projet, comme sur ce portfolio'],
    delay: '5 à 8 semaines',
    rounds: '3 séries',
  },
  {
    name: 'Custom',
    price: 'Sur devis',
    pitch: 'Pour ce qui ne rentre dans aucune case :',
    features: ['Boutique en ligne', 'Espace client', 'Fonctions sur mesure'],
    delay: 'Selon le projet',
    rounds: 'Selon le projet',
  },
]

export const planNotes = [
  { strong: 'Hébergement offert', text: 'la première année, maintenance possible ensuite.' },
  { strong: 'Paiement en deux fois :', text: '50 % à la commande, 50 % à la mise en ligne. Mobile Money, virement ou espèces.' },
  { strong: 'Maintenance :', text: 'à partir de 15 000 FCFA par intervention, ou 25 000 FCFA par mois.' },
]

export const steps = [
  { title: 'On en parle', text: 'Un message WhatsApp suffit. Je comprends votre activité, vos clients et votre budget.' },
  { title: 'Je vous montre', text: 'Vous voyez la direction visuelle et les écrans avant que je code. On ajuste ensemble.' },
  { title: 'Je construis', text: 'Le site est testé sur téléphone et sur ordinateur. Les retouches de votre formule sont incluses.' },
  { title: 'On lance', text: 'Derniers réglages de vitesse, mise en ligne, et je reste disponible pour la suite.' },
]

export const about = {
  title: "Moi, c'est Samir.",
  paragraphs: [
    'Je suis vibe codeur : je combine le code et l’IA pour construire vite, sans baisser la qualité. Je vis à Dosso, au Niger, et je travaille avec des commerçants, des marques et des entreprises de toute l’Afrique francophone.',
    'Mon studio, Renoi Studio, signe mes sites premium. Sur TikTok, je montre comment je construis mes projets, de l’idée à la mise en ligne.',
  ],
  stack: ['Three.js', 'React', 'TypeScript', 'Tailwind', 'GSAP', 'Shopify', 'Chariow', 'Netlify', 'Telegram', 'Python', 'Google Sheets', 'Claude', 'ElevenLabs'],
}

export const faq = [
  { q: 'Combien coûte un site ?', a: 'Les formules démarrent à 150 000 FCFA. Ce sont des prix de départ : le tarif final dépend de votre projet et vous est donné avant de commencer, sans frais cachés.' },
  { q: 'Combien de temps faut-il ?', a: 'De 1 à 2 semaines pour un Starter, jusqu’à 5 à 8 semaines pour un Cinematic. Après notre premier échange, je vous donne un calendrier clair.' },
  { q: 'Comment se passe le paiement ?', a: 'En deux fois : 50 % à la commande pour démarrer, 50 % à la mise en ligne. Mobile Money, virement ou espèces.' },
  { q: 'Combien de retouches sont incluses ?', a: 'De 1 à 3 séries selon la formule, sur les écrans prévus au départ. Pour des ajouts qui sortent du projet, on en discute simplement.' },
  { q: 'Et après la mise en ligne ?', a: "L'hébergement est offert la première année. Ensuite, je peux m'occuper de la maintenance : à partir de 15 000 FCFA pour une intervention ponctuelle, ou 25 000 FCFA par mois." },
  { q: "Je n'ai ni logo ni textes. C'est un problème ?", a: "Non. J'écris les textes de vente et je peux créer vos visuels et vos vidéos. Vous m'expliquez votre activité, je m'occupe du reste." },
  { q: 'Vous travaillez en dehors du Niger ?', a: 'Oui. Tout se fait à distance par WhatsApp, avec une validation à chaque étape. Je travaille avec toute l’Afrique francophone.' },
]

export const needs = ['Site vitrine', 'Boutique en ligne', 'Appli ou outil IA', 'Bot Telegram', 'Vidéos pub', 'Textes de vente']
export const budgets = ['À définir ensemble', 'Moins de 150 000 FCFA', '150 000 à 300 000 FCFA', '300 000 à 600 000 FCFA', 'Plus de 600 000 FCFA']

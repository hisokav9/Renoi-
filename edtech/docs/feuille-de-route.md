# Feuille de route

## Phases 0 et 1 — livrées

### Critères de livraison (§11)

| Critère | État |
|---|---|
| Code documenté | ✅ docstrings, ADR, documentation d'architecture, d'exploitation et de sécurité |
| Tests automatisés | ✅ 94 tests (unitaires + intégration sur PostgreSQL et Redis réels), couverture 85 % ; ruff et mypy strict sans erreur |
| Erreurs gérées | ✅ erreurs métier typées, format `problem+json`, bot qui répond toujours, traitements remboursés en cas d'échec |
| Autorisations vérifiées | ✅ permissions par rôle testées (élève, relecteur, support, administrateur) |
| Consommation de ressources mesurée | ⚠️ partiel : métriques Prometheus (latences, volumes, durées d'étapes) en place ; pas encore de test de charge |
| Testé en staging | ❌ aucun environnement de staging n'existe encore. L'image a été construite et démarrée localement (migrations, catalogue, API, sondes) et un traitement a traversé Redis → worker Celery → base de données de bout en bout |
| Procédure de déploiement et de retour arrière | ✅ rédigée ([deploiement.md](deploiement.md)), à exécuter lors du premier déploiement staging |

### Hors périmètre de ces phases (volontairement)

- Inscription par e-mail / mot de passe : le modèle `auth_identities` est prêt à accueillir
  d'autres fournisseurs ; à ajouter avec le site web (phase 8).
- Achat de crédits et abonnements : phase 7 (les écrans du bot l'annoncent).
- Réception des documents : phase 2 (le bot répond que la correction arrive bientôt et ne
  télécharge rien).

## Prochaines étapes

### Exploitation (avant ou pendant la phase 2)

1. Choisir l'hébergeur et créer l'environnement **staging** (check-list dans
   [deploiement.md](deploiement.md)).
2. Créer le bot de staging et le registre d'images ; ajouter à la CI la publication de l'image et
   le déploiement automatique en staging.
3. Faire valider le catalogue du Niger (séries, matières) par un pédagogue nigérien, puis passer
   `verified: true` ; compléter les séries techniques.
4. Lancer la revue juridique (données des mineurs, conservation, consentement).

### Phase 2 — réception et lecture des épreuves

- Réception photo (JPG, PNG, WebP), PDF, multipages et albums Telegram (`media_group_id`).
- Validation stricte : type réel, taille, pixels, pages, PDF chiffrés ou actifs refusés.
- Détection de flou, de cadrage et de pages manquantes avec demande de nouvelle photo.
- Stockage chiffré, purge automatique selon la durée de conservation du pays.
- Couche d'abstraction IA (ports par capacité, adaptateurs par fournisseur, sorties structurées,
  traçabilité des modèles et des coûts).
- Étapes `receive` → `identify_questions` du pipeline ; affichage de l'énoncé reconstruit à
  l'élève avec signalement des passages illisibles.
- Notification Telegram de l'avancement et de la fin des traitements (`JobNotifier`).
- Métriques Prometheus des workers (mode multiprocessus).

### Phases 3 à 8

3. Moteur de correction (classification, résolution, rédaction structurée en 10 parties).
4. Vérification indépendante (calcul symbolique et numérique, unités, second modèle, révision
   humaine par le rôle `reviewer`).
5. Studio audio et vidéo (scénario, voix, Manim, Remotion, FFmpeg, sous-titres, PDF).
6. Bibliothèque pédagogique (chapitres, notions, sources avec provenance, édition et date).
7. Monétisation (paiements mobiles adaptés au Niger, abonnements, offres établissements).
8. Site web Next.js, applications mobiles, espaces enseignant et établissement, autres pays.

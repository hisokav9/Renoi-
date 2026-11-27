# Comparatif des fournisseurs d'IA

*Relevé le 27/11/2026 sur les pages officielles des fournisseurs (sources en fin de document).
Les prix changent souvent : les revérifier avant tout engagement.*

## Ce dont la plateforme a besoin

| Étape du pipeline | Besoin | Exigence |
|---|---|---|
| Lecture | Photos et PDF d'exercices, manuscrits ou imprimés, avec formules, figures et tableaux | Fidélité à l'énoncé ; signaler l'illisible plutôt qu'inventer |
| Résolution | Mathématiques, physique-chimie, SVT, français… en français | Raisonnement juste, étapes complètes, unités correctes |
| Rédaction | Correction structurée en 10 parties | Sorties structurées (JSON validé) |
| Vérification | Contrôle **indépendant** de la solution | Un autre fournisseur, pour que les erreurs ne se recoupent pas |
| Toutes | Utilisateurs souvent **mineurs** (dès le primaire), au Niger | Usage autorisé pour les mineurs, pas d'entraînement sur leurs données, conservation minimale |

## Critères éliminatoires

| Fournisseur | Niger pris en charge | Service pour mineurs | Données d'API utilisées pour l'entraînement | Conservation des contenus |
|---|---|---|---|---|
| **Anthropic (Claude)** | ✅ oui | ✅ autorisé avec mesures de protection | ❌ non, sauf accord exprès | Non conservés par défaut, sauf modèles « Fable/Mythos » (30 jours) ; zéro conservation (ZDR) sur demande |
| **OpenAI (GPT)** | ✅ oui | ✅ autorisé avec mesures de protection ; **moins de 13 ans : ZDR obligatoire** avant de traiter leurs données personnelles | ❌ non (sauf adhésion volontaire) | Journaux anti-abus jusqu'à 30 jours ; ZDR sur approbation |
| **Google (API Gemini)** | ✅ oui | ⛔ **interdit** : les conditions de l'API Gemini excluent les services « destinés ou susceptibles d'être utilisés par des moins de 18 ans » | Offre payante : non. Offre gratuite : **oui** | — |
| **Mistral** | non vérifié | non vérifié | non vérifié | Option de traitement en Europe (+10 %) |

**Conséquences :**
- **L'API Gemini (Google AI Studio) est exclue** pour une plateforme destinée aux élèves, quelle que soit la qualité de ses modèles. L'offre Google Cloud (Vertex AI) a d'autres conditions, non étudiées ici.
- **Mistral** reste à vérifier : ses conditions d'utilisation (site legal.mistral.ai) n'ont pas pu être lues depuis l'environnement de travail.

## Les modèles en lice

Prix par million de *tokens* (≈ 750 000 mots), en entrée / en sortie.

| Fournisseur | Modèle | Positionnement | Entrée | Sortie |
|---|---|---|---|---|
| Anthropic | Claude Opus 5.5 (`claude-opus-5-5`) | Raisonnement de pointe, vision | 4 $ | 20 $ |
| Anthropic | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | Équilibre qualité / coût | 2 $ | 10 $ |
| Anthropic | Claude Haiku 5.5 (`claude-haiku-5-5`) | Tâches simples à fort volume | 0,10 $ | 0,50 $ |
| Anthropic | Claude Fable 5.2 (`claude-fable-5-2`) | Le plus capable ; **conservation 30 jours obligatoire** | 8 $ | 40 $ |
| OpenAI | GPT-6.2 Astra | Le plus capable | 8 $ | 40 $ |
| OpenAI | GPT-6.2 Sol | Usage courant | 2 $ | 10 $ |
| OpenAI | GPT-6.1 Terra | Raisonnement visuel, rapide | 1 $ | 5 $ |
| OpenAI | GPT-6 Luna | Tâches simples à fort volume | 0,10 $ | 0,50 $ |
| Mistral | Mistral Large 4 | Modèle phare | 0,70 $ | 2,10 $ |
| Mistral | OCR 4.1 | OCR spécialisé (documents) | 4 $ / 1 000 pages | — |
| Google *(exclu)* | Gemini 4 Carbon / Argon | Raisonnement | 2 $ → **4 $ au 1/12/2026** | 10 $ → **20 $** |

Pour les modèles qui « réfléchissent », la réflexion est facturée comme des tokens de sortie. C'est le poste principal pour la résolution d'exercices.

## Coût estimé d'une correction (texte)

**Hypothèse à mesurer en phase 3** : 2 photos par sujet.

| Étape | Entrée | Sortie |
|---|---|---|
| Lecture | ≈ 4 000 tokens | ≈ 1 500 tokens |
| Résolution et rédaction | ≈ 5 000 tokens | ≈ 12 000 tokens |
| Vérification | ≈ 10 000 tokens | ≈ 4 000 tokens |

| Combinaison | Lecture + résolution | Vérification | **Total / correction** |
|---|---|---|---|
| **A. Qualité** : Claude Opus 5.5 + vérification GPT-6.2 Sol | 0,31 $ | 0,06 $ | **≈ 0,37 $** |
| B. Économique : Claude Sonnet 5.5 + vérification GPT-6.2 Sol | 0,15 $ | 0,06 $ | **≈ 0,21 $** |
| C. Exigeante : Claude Opus 5.5 + vérification GPT-6.2 Astra | 0,31 $ | 0,24 $ | **≈ 0,55 $** |

- Au taux indicatif de 600 FCFA pour 1 $, A ≈ 220 FCFA par correction.
- Ces chiffres fixent le prix minimal d'un crédit (phase 7).
- Le traitement par lots (−50 %) ne convient pas aux corrections à la demande : il peut prendre des heures. Il servira pour les campagnes de mesure.
- La mise en cache des consignes réduira un peu le coût d'entrée.

## Recommandation

1. **Fournisseur principal : Anthropic (Claude).**
   - Il coche tous les critères éliminatoires, et ses règles pour les mineurs sont publiées.
   - Opus 5.5 pour lire et résoudre (la qualité d'abord), Haiku 5.5 pour les tâches simples (classement, détection de matière).
   - Ne pas utiliser les modèles Fable/Mythos : ils imposent une conservation de 30 jours, incompatible avec une demande de zéro conservation.
2. **Vérificateur indépendant : OpenAI (GPT-6.2 Sol ; Astra pour les cas difficiles).**
   - Un second fournisseur réduit le risque que les deux étapes se trompent de la même façon.
   - En cas de désaccord, la correction est bloquée ou envoyée en relecture humaine (rôle `reviewer`).
   - S'y ajoute un contrôle par calcul symbolique et numérique, sans IA, pour les résultats chiffrés.
3. **Moins de 13 ans** (primaire, début de collège) :
   - demander la **zéro conservation (ZDR)** à OpenAI, et aussi à Anthropic, avant d'ouvrir ces classes ;
   - et n'envoyer au vérificateur que l'énoncé transcrit, sans photo ni nom d'élève.
4. **Mistral OCR** : à tester comme deuxième lecteur pour les copies manuscrites difficiles (très bon marché), une fois ses conditions vérifiées.
5. **Ne pas décider sur le papier.**
   - Le choix final se fait en mesurant chaque combinaison sur **50 à 100 vrais sujets nigériens** (BEPC, Bac A/C/D) avec leurs corrigés officiels.
   - Mesures : justesse de la lecture, justesse du résultat final, qualité des étapes (grille du pédagogue), erreurs d'unités, incertitudes signalées, temps de réponse, coût réel.
   - Seuil proposé avant ouverture : au moins 95 % de résultats finals justes sur le périmètre ouvert, et zéro réponse fausse affirmée sans signalement.

*Transparence : cette analyse a été rédigée par un modèle Claude (Anthropic). C'est une raison
de plus pour trancher sur les mesures plutôt que sur cet avis.*

## Ce qu'il faut pour démarrer

- Un compte **Anthropic** (platform.claude.com) avec une carte bancaire, puis une clé API dédiée à la plateforme.
- Un compte **OpenAI** (platform.openai.com), puis une clé API.
- Les demandes de **zéro conservation** se font auprès de leurs équipes commerciales ; à lancer tôt, les délais sont inconnus.
- Un budget de mesure : environ 100 sujets × 3 combinaisons × 0,55 $ au plus, soit **moins de 200 $**.

## Sources

- Anthropic : [tarifs](https://platform.claude.com/docs/en/about-claude/pricing), [conservation des données](https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention), [pays pris en charge](https://www.anthropic.com/supported-countries), [mineurs](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)
- OpenAI : [tarifs](https://openai.com/api/pricing/), [pays pris en charge](https://developers.openai.com/api/docs/supported-countries), [utilisation des données](https://developers.openai.com/api/docs/guides/your-data), [moins de 18 ans](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)
- Google : [tarifs](https://ai.google.dev/gemini-api/docs/pricing), [régions](https://ai.google.dev/gemini-api/docs/available-regions), [conditions (âge, données)](https://ai.google.dev/gemini-api/terms)
- Mistral : [tarifs](https://mistral.ai/pricing/api/)

# Bot Telegram

## Créer et brancher un bot

1. Dans Telegram, écrire à **@BotFather** : `/newbot`, choisir un nom et un identifiant. Il donne
   le **jeton** (`123456:ABC…`). Créer **un bot par environnement** (développement, staging,
   production).
2. Générer un secret de webhook (lettres, chiffres, `_` et `-`, 256 caractères max) :
   `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
3. Configurer (gestionnaire de secrets en staging/production, `.env` en local) :
   ```
   EDTECH_TELEGRAM_BOT_TOKEN=123456:ABC…
   EDTECH_TELEGRAM_WEBHOOK_SECRET=<secret généré>
   EDTECH_TELEGRAM_BOT_USERNAME=<identifiant du bot, sans @>
   EDTECH_PUBLIC_BASE_URL=https://api.<domaine>
   ```
4. Déclarer le webhook et les commandes : `edtech telegram-set-webhook`
   (ajouter `--drop-pending` pour ignorer les messages reçus pendant une coupure).
5. Vérifier : `edtech telegram-webhook-info`.
6. Écrire `/start` au bot, puis se donner le rôle administrateur :
   `edtech set-role --telegram-id <votre identifiant Telegram> --role admin`.

Pour développer en local, Telegram doit pouvoir joindre votre machine en HTTPS : utiliser un
tunnel (Cloudflare Tunnel, ngrok…) et le mettre dans `EDTECH_PUBLIC_BASE_URL`.

Pour recevoir les tickets d'assistance dans un groupe de l'équipe : ajouter le bot au groupe et
renseigner `EDTECH_SUPPORT_CHAT_ID` (identifiant négatif du groupe).

## Parcours utilisateur

```
/start
 ├─ nouveau : accueil → langue → pays → niveau → classe → série (si la classe en a) → menu
 └─ inscrit : menu principal
       📸 Corriger un exercice   (consigne de prise de vue ; ouverture en phase 2)
       🗂 Mes corrections        (historique paginé, statut de chaque traitement)
       👤 Mon compte             (crédits, offre, profil, assistance, suppression du compte)
       ⚙️ Préférences            (classe, langue)
       ❓ Aide                    (mode d'emploi, avertissement sur les limites de l'IA)
```

Commandes : `/start`, `/menu`, `/compte` (`/account`), `/historique` (`/history`), `/aide`
(`/help`), `/support`, `/langue` (`/language`).

Les boutons modifient le message existant au lieu d'empiler de nouveaux messages. Tous les textes
sont dans `src/edtech/locales/` (français et anglais) ; un test vérifie que les deux langues sont
complètes.

## Fonctionnement technique

- `POST /api/v1/telegram/webhook` vérifie l'en-tête `X-Telegram-Bot-Api-Secret-Token`, ignore les
  doublons (`update_id`), puis traite la mise à jour avec un délai maximal de 25 s.
- Seules les conversations privées sont traitées ; les groupes et les robots sont ignorés.
- Limite : 30 messages par minute et par utilisateur (`EDTECH_RATE_LIMIT_TELEGRAM_PER_MINUTE`).
- Un utilisateur est créé au premier message ; il reçoit `EDTECH_SIGNUP_FREE_CREDITS` crédits.

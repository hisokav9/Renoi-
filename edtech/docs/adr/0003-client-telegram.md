# ADR 0003 — Client Telegram maison, webhook synchrone

- Statut : accepté
- Date : 2026-11-27

## Contexte

Le bot est la première interface. Il doit être fiable, testable sans réseau, et ne jamais exposer
le jeton du bot (présent dans chaque URL de l'API Bot).

## Décision

- Un **client minimal** (`modules/telegram/client.py`, httpx) et des modèles Pydantic limités aux
  champs utilisés, plutôt qu'un framework (aiogram, python-telegram-bot). Le comportement du bot
  est testé de bout en bout avec un faux serveur Telegram.
- **Webhook** (pas de *polling*) protégé par le jeton secret `X-Telegram-Bot-Api-Secret-Token`,
  déduplication par `update_id` dans Redis, réponse 200 même si le traitement échoue (sinon
  Telegram renvoie la mise à jour en boucle).
- Les commandes courtes sont traitées dans la requête ; tout ce qui est long (téléchargement,
  correction) passera par un traitement asynchrone (phase 2).
- Parcours d'inscription **sans état serveur** : chaque bouton porte l'identifiant du choix et le
  profil est enregistré à chaque étape.
- Les journaux `httpx` sont maintenus au niveau WARNING (ils contiendraient l'URL, donc le jeton).

## Conséquences

- Ajouter une méthode de l'API Bot = ajouter une méthode au client (quelques lignes).
- Si les besoins conversationnels deviennent complexes, un framework pourra être adopté derrière
  `TelegramBot.handle_update` sans toucher au webhook.

# ADR 0004 — Crédits : grand livre avec réservation

- Statut : accepté
- Date : 2026-11-27

## Contexte

Les crédits doivent être « débités de façon contrôlée, avec remboursement automatique en cas
d'échec technique » (§8). Les traitements sont asynchrones et peuvent être rejoués.

## Décision

- `credit_accounts` (solde disponible `balance`, crédits réservés `reserved`) +
  `credit_transactions`, journal en ajout seul dont on peut reconstruire les soldes.
- Cycle d'un traitement payant : **réservation** à la création (dans la même transaction que le
  traitement) → **consommation** au succès ou **libération** (remboursement) à l'échec ou à
  l'annulation. Consommation et libération s'excluent.
- Chaque opération a une **clé d'idempotence** unique (`reserve:<job>`, `capture:<job>`,
  `signup:<user>`, `admin:<clé fournie>`…) : la rejouer renvoie l'opération d'origine.
- Verrou de ligne (`SELECT … FOR UPDATE`) sur le compte et contraintes `balance >= 0`,
  `reserved >= 0` : aucun découvert possible, même en concurrence (testé).

## Conséquences

- Les achats (phase 7) seront des opérations `purchase` avec la référence du paiement comme clé
  d'idempotence (protection contre les notifications de paiement en double).
- Les comptes et le journal sont conservés après suppression d'un compte utilisateur (obligations
  comptables), rattachés à un identifiant anonymisé.

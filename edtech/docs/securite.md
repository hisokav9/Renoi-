# Sécurité et confidentialité

Une grande partie des utilisateurs sont **mineurs**. Principe : collecter le minimum, ne rien
exposer dans les journaux, tracer les accès privilégiés.

## Mesures en place

| Exigence (§7) | Mise en œuvre |
|---|---|
| HTTPS | Terminé par l'équilibreur de charge ; `Strict-Transport-Security` en staging/production ; refus de démarrer si `EDTECH_PUBLIC_BASE_URL` n'est pas en HTTPS. |
| Secrets | Variables d'environnement issues du gestionnaire de secrets de l'hébergeur, typées `SecretStr` (jamais affichées). Valeurs par défaut refusées hors développement. Le jeton du bot n'apparaît dans aucun journal (journaux `httpx` coupés, messages d'erreur réseau nettoyés). |
| Contrôle d'accès par rôles | Rôles `student`, `teacher`, `school_admin`, `reviewer`, `support`, `admin` ; les routes vérifient des **permissions** (`modules/auth/permissions.py`). Le rôle est relu en base à chaque requête (révocation immédiate). Un traitement d'un autre utilisateur répond 404 (on ne révèle pas son existence). Un administrateur ne peut pas modifier son propre rôle. |
| Authentification | Signatures Telegram vérifiées (HMAC, comparaison à temps constant, fraîcheur ≤ 24 h). Jetons d'accès de 15 min ; jetons de rafraîchissement opaques, stockés hachés, renouvelés à chaque usage ; la réutilisation d'un ancien jeton révoque toute la session. |
| Abus et envois automatisés | Limite par utilisateur Telegram (30 messages/min par défaut, un seul avertissement) et par adresse IP sur l'authentification (20/min) ; groupes et comptes de robots ignorés ; mises à jour Telegram dédupliquées ; webhook protégé par jeton secret ; taille des requêtes du webhook limitée. |
| Validation | Toutes les entrées passent par des schémas Pydantic stricts (champs inconnus refusés sur le profil) ; cohérence pays → programme → classe → série vérifiée ; clés de stockage validées (pas de traversée de répertoires). |
| Isolation des traitements | Workers séparés de l'API, par file ; un traitement ne peut écrire que s'il détient le bail. Les rendus vidéo (phase 5) tourneront dans des processus limités en temps et en mémoire. |
| Journaux sans données personnelles | Masquage automatique des clés sensibles (noms, textes des messages, jetons…) ; seul l'identifiant interne de l'utilisateur est journalisé ; Sentry configuré sans données personnelles. |
| Traçabilité | `audit_logs` pour l'inscription, les changements de rôle, les attributions de crédits, la suppression de compte. |
| Minimisation | Aucun nom, pseudonyme, téléphone ni e-mail stocké. Le prénom Telegram est affiché mais jamais enregistré. Les fichiers envoyés avant la phase 2 ne sont ni téléchargés ni conservés. |
| Droit à l'effacement | « Supprimer mon compte » (bot) et `DELETE /api/v1/me` : identités et sessions supprimées, tickets supprimés, contenu des traitements effacé, profil anonymisé ; le journal des crédits est conservé, rattaché à un identifiant anonyme. |
| Chiffrement au repos | Stockage S3 avec chiffrement côté serveur imposé à chaque écriture ; base et sauvegardes chiffrées par le service managé. |

## À faire avant l'ouverture au public

Ces points ne relèvent pas uniquement du code et **doivent être validés par des personnes
qualifiées** :

- **Juridique (Niger puis chaque pays)** : faire valider par un juriste la conformité à la
  législation nigérienne sur la protection des données personnelles et les obligations vis-à-vis
  de l'autorité de contrôle ; règles de consentement pour les mineurs (âge, accord parental) ;
  mentions d'information ; conditions d'utilisation ; lieu d'hébergement des données. Les
  paramètres retenus iront dans `countries.settings` (par pays).
- **Politique de conservation** : durée de conservation des documents et corrections (une valeur
  provisoire de 90 jours figure dans le brouillon Niger), purge automatique (phase 2), purge dans
  les sauvegardes.
- **Fournisseurs d'IA** (phase 3) : contrats garantissant l'absence d'entraînement sur les
  données des élèves, région de traitement, durée de rétention chez le fournisseur.
- **Tests d'intrusion** avant la production, puis à chaque évolution majeure.
- **Fichiers envoyés** (phase 2) : vérification du type réel (signature binaire), limites de
  taille, de pages et de pixels (protection contre les « bombes de décompression »), rejet des
  PDF chiffrés ou contenant du JavaScript, traitement dans un processus isolé.

## Signaler une faille

Prévoir une adresse dédiée (ex. `security@<domaine>`) une fois le nom commercial choisi.

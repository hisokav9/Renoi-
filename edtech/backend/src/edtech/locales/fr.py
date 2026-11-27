"""Textes en français (langue de référence). Format HTML Telegram : échapper les variables."""

MESSAGES: dict[str, str] = {
    # Accueil et inscription
    "welcome_new": (
        "Bonjour {name} 👋\n\n"
        "Je t'aide à comprendre tes exercices : envoie-moi la photo ou le PDF d'un sujet et je "
        "t'explique la correction étape par étape, avec les méthodes et les formules utilisées.\n\n"
        "Pour adapter mes explications à ton niveau, réponds à quelques questions."
    ),
    "welcome_back": "Re-bonjour {name} 👋 Que veux-tu faire ?",
    "onboarding_language": "🌐 Choisis ta langue :",
    "onboarding_country": "🌍 Dans quel pays étudies-tu ?",
    "onboarding_cycle": "🏫 Quel est ton niveau ?",
    "onboarding_grade": "🎓 Quelle est ta classe ?",
    "onboarding_series": "📘 Quelle est ta série ?",
    "onboarding_no_program": (
        "Ce pays n'est pas encore entièrement configuré. Choisis un autre pays ou contacte "
        "l'assistance."
    ),
    "onboarding_done": (
        "C'est noté ✅\n\n{profile}\n\n"
        "Tu disposes de <b>{balance}</b> crédit(s) pour essayer. Tu peux modifier ces "
        "informations à tout moment dans « Préférences »."
    ),
    "profile_updated": "Profil mis à jour ✅\n\n{profile}",
    "series_unknown": "Je ne sais pas / autre",
    "cycle_primary": "Primaire",
    "cycle_lower_secondary": "Collège",
    "cycle_upper_secondary": "Lycée",
    "cycle_higher": "Supérieur",
    "lang_fr": "🇫🇷 Français",
    "lang_en": "🇬🇧 English",
    "language_changed": "Langue mise à jour ✅",
    # Menu
    "menu_title": "Que veux-tu faire ?",
    "btn_correct": "📸 Corriger un exercice",
    "btn_history": "🗂 Mes corrections",
    "btn_account": "👤 Mon compte",
    "btn_preferences": "⚙️ Préférences",
    "btn_help": "❓ Aide",
    "btn_back": "⬅️ Retour",
    "btn_support": "💬 Contacter l'assistance",
    "btn_delete_account": "🗑 Supprimer mon compte",
    "btn_confirm_delete": "Oui, supprimer définitivement",
    "btn_cancel": "Annuler",
    "btn_buy_credits": "➕ Obtenir des crédits",
    "btn_change_school": "🎓 Ma classe",
    "btn_change_language": "🌐 Langue",
    "btn_previous": "◀️ Précédent",
    "btn_next": "Suivant ▶️",
    # Correction
    "correct_instructions": (
        "📸 Envoie la photo de ton exercice (bien nette, page entière, sans reflet) ou son PDF. "
        "Tu peux envoyer plusieurs photos pour un même sujet."
    ),
    "correct_unavailable": (
        "🚧 La correction automatique arrive bientôt. Nous finalisons et vérifions le moteur de "
        "correction pour qu'il soit fiable. Tu seras prévenu(e) dès son ouverture."
    ),
    # Historique
    "history_empty": "Tu n'as encore envoyé aucun exercice.",
    "history_title": "🗂 <b>Tes corrections</b> ({total}) :",
    "history_item": "• {date} — {status}",
    "job_status_queued": "⏳ en attente",
    "job_status_running": "⚙️ en cours",
    "job_status_awaiting_input": "❓ question en attente",
    "job_status_succeeded": "✅ terminée",
    "job_status_failed": "⚠️ échec (crédits remboursés)",
    "job_status_cancelled": "✖️ annulée",
    # Compte
    "account": (
        "👤 <b>Mon compte</b>\n\n"
        "Crédits disponibles : <b>{balance}</b>\n"
        "Crédits réservés : {reserved}\n"
        "Offre : {plan}\n"
        "Membre depuis le : {since}\n"
        "Référence : <code>{ref}</code> (à donner à l'assistance)\n\n"
        "{profile}"
    ),
    "plan_free": "Gratuite",
    "profile_summary": "Pays : {country}\nClasse : {grade}\nSérie : {series}",
    "profile_not_set": "non renseigné",
    "buy_credits_unavailable": (
        "Les recharges de crédits et les abonnements seront disponibles prochainement."
    ),
    "delete_confirm": (
        "⚠️ Supprimer ton compte efface ton profil, ton historique et tes documents. Tes crédits "
        "restants seront perdus. Cette action est définitive. Confirmer ?"
    ),
    "delete_done": "Ton compte a été supprimé. Tu peux revenir quand tu veux avec /start.",
    # Préférences
    "preferences_title": "⚙️ <b>Préférences</b> — que veux-tu modifier ?",
    # Aide et assistance
    "help": (
        "❓ <b>Aide</b>\n\n"
        "• Envoie la photo ou le PDF d'un exercice pour obtenir sa correction détaillée.\n"
        "• /menu affiche le menu principal.\n"
        "• /compte affiche tes crédits.\n"
        "• /historique affiche tes corrections.\n"
        "• /aide affiche ce message.\n\n"
        "Les corrections sont produites par une intelligence artificielle puis vérifiées "
        "automatiquement. Elles peuvent néanmoins contenir des erreurs : compare toujours avec "
        "ton cours et demande conseil à ton professeur."
    ),
    "support_prompt": (
        "💬 Écris ton message en une seule fois (problème rencontré, question…). L'équipe te "
        "répondra ici. N'indique pas d'informations personnelles (téléphone, adresse…)."
    ),
    "support_received": "Merci, ton message a été transmis à l'équipe (référence {ref}).",
    "support_forward": "🆘 Ticket #{ref}\nÉlève : {user_ref}\n\n{message}",
    "support_reply": "💬 <b>Réponse de l'assistance</b> (ticket #{ref}) :\n\n{message}",
    "credits_gift": "🎁 L'équipe t'a offert {amount} crédit(s). Nouveau solde : {balance}.",
    # Administration (/admin, réservé à l'équipe)
    "admin_home": "🛠 <b>Administration</b>",
    "btn_admin_stats": "📊 Statistiques",
    "btn_admin_tickets": "🆘 Tickets ouverts ({count})",
    "btn_admin_credits": "➕ Ajouter des crédits",
    "btn_admin_reply": "✍️ Répondre",
    "btn_admin_close": "✅ Clore le ticket",
    "btn_admin_gift": "🎁 Offrir des crédits",
    "btn_admin_home": "🛠 Administration",
    "btn_confirm": "✅ Confirmer",
    "btn_main_menu": "🏠 Menu principal",
    "admin_stats": (
        "📊 <b>Statistiques</b>\n\n"
        "Inscrits : <b>{users}</b> (profil complété : {onboarded})\n"
        "Nouveaux : {new_24h} en 24 h · {new_7d} en 7 jours\n"
        "Actifs sur 7 jours : {active_7d}\n"
        "Tickets ouverts : {open_tickets}\n"
        "Crédits disponibles chez les élèves : {credits}\n"
        "Traitements sur 7 jours : {jobs}"
    ),
    "admin_none": "aucun",
    "admin_tickets_title": "🆘 <b>Tickets ouverts</b> ({total})",
    "admin_tickets_empty": "Aucun ticket ouvert 🎉",
    "admin_ticket_line": "• <b>#{ref}</b> — {date} — {excerpt}",
    "admin_ticket": (
        "🆘 <b>Ticket #{ref}</b> — {date}\n"
        "Élève : <code>{user_ref}</code> · {balance} crédit(s)\n"
        "{profile}\n\n{message}"
    ),
    "admin_ticket_done": "Ce ticket a déjà été traité.",
    "admin_reply_prompt": (
        "✍️ Écris ta réponse au ticket #{ref} en un seul message. Elle sera envoyée à l'élève, "
        "puis le ticket sera clos."
    ),
    "admin_reply_sent": "Réponse envoyée ✅ Le ticket #{ref} est clos.",
    "admin_reply_failed": (
        "⚠️ Réponse non délivrée : l'élève a peut-être bloqué le bot ou supprimé son compte. "
        "Le ticket reste ouvert."
    ),
    "admin_ticket_closed": "Ticket #{ref} clos ✅",
    "admin_credit_prompt": (
        "➕ Envoie la référence de l'élève (8 caractères, visible dans son écran « Mon compte » "
        "et sur ses tickets)."
    ),
    "admin_user_not_found": (
        "Aucun élève trouvé avec la référence « {ref} ». Vérifie et renvoie-la."
    ),
    "admin_user_card": (
        "👤 Élève <code>{user_ref}</code>\n"
        "Inscrit le {since} · {balance} crédit(s)\n"
        "{profile}\n\n"
        "Combien de crédits ajouter ?"
    ),
    "admin_grant_confirm": "Ajouter <b>{amount}</b> crédit(s) à l'élève <code>{user_ref}</code> ?",
    "admin_grant_done": "✅ {amount} crédit(s) ajouté(s). Nouveau solde de l'élève : {balance}.",
    "admin_grant_expired": "Cette opération a expiré ou a déjà été effectuée.",
    "admin_new_ticket": "🆘 Nouveau ticket #{ref} : {excerpt}\n\nTape /admin pour répondre.",
    # Erreurs et limites
    "rate_limited": "Doucement 🙂 Tu envoies beaucoup de messages. Réessaie dans {seconds} s.",
    "unknown_input": "Je n'ai pas compris. Envoie la photo d'un exercice ou utilise le menu.",
    "error_generic": "Oups, une erreur s'est produite. Réessaie dans un instant.",
    "account_suspended": (
        "Ton compte est suspendu. Contacte l'assistance si tu penses qu'il s'agit d'une erreur."
    ),
    "step_expired": "Cette étape n'est plus valable, recommençons.",
    # Commandes Telegram
    "cmd_start": "Démarrer",
    "cmd_menu": "Menu principal",
    "cmd_account": "Mon compte et mes crédits",
    "cmd_history": "Mes corrections",
    "cmd_help": "Aide",
}

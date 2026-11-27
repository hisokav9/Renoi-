"""English texts. Must define exactly the same keys and placeholders as ``fr.py``."""

MESSAGES: dict[str, str] = {
    "welcome_new": (
        "Hello {name} 👋\n\n"
        "I help you understand your exercises: send me a photo or a PDF of an assignment and I "
        "will explain the solution step by step, with the methods and formulas used.\n\n"
        "To adapt my explanations to your level, please answer a few questions."
    ),
    "welcome_back": "Welcome back {name} 👋 What would you like to do?",
    "onboarding_language": "🌐 Choose your language:",
    "onboarding_country": "🌍 Which country do you study in?",
    "onboarding_cycle": "🏫 What is your level?",
    "onboarding_grade": "🎓 What is your grade?",
    "onboarding_series": "📘 What is your track (série)?",
    "onboarding_no_program": (
        "This country is not fully configured yet. Choose another country or contact support."
    ),
    "onboarding_done": (
        "Got it ✅\n\n{profile}\n\n"
        "You have <b>{balance}</b> credit(s) to try the service. You can change this "
        "information at any time in “Preferences”."
    ),
    "profile_updated": "Profile updated ✅\n\n{profile}",
    "series_unknown": "I don't know / other",
    "cycle_primary": "Primary school",
    "cycle_lower_secondary": "Middle school",
    "cycle_upper_secondary": "High school",
    "cycle_higher": "Higher education",
    "lang_fr": "🇫🇷 Français",
    "lang_en": "🇬🇧 English",
    "language_changed": "Language updated ✅",
    "menu_title": "What would you like to do?",
    "btn_correct": "📸 Correct an exercise",
    "btn_history": "🗂 My corrections",
    "btn_account": "👤 My account",
    "btn_preferences": "⚙️ Preferences",
    "btn_help": "❓ Help",
    "btn_back": "⬅️ Back",
    "btn_support": "💬 Contact support",
    "btn_delete_account": "🗑 Delete my account",
    "btn_confirm_delete": "Yes, delete permanently",
    "btn_cancel": "Cancel",
    "btn_buy_credits": "➕ Get credits",
    "btn_change_school": "🎓 My grade",
    "btn_change_language": "🌐 Language",
    "btn_previous": "◀️ Previous",
    "btn_next": "Next ▶️",
    "correct_instructions": (
        "📸 Send a photo of your exercise (sharp, full page, no glare) or its PDF. You can send "
        "several photos for the same assignment."
    ),
    "correct_unavailable": (
        "🚧 Automatic correction is coming soon. We are finalising and checking the correction "
        "engine so that it is reliable. You will be notified as soon as it opens."
    ),
    "history_empty": "You have not sent any exercise yet.",
    "history_title": "🗂 <b>Your corrections</b> ({total}):",
    "history_item": "• {date} — {status}",
    "job_status_queued": "⏳ waiting",
    "job_status_running": "⚙️ in progress",
    "job_status_awaiting_input": "❓ question pending",
    "job_status_succeeded": "✅ done",
    "job_status_failed": "⚠️ failed (credits refunded)",
    "job_status_cancelled": "✖️ cancelled",
    "account": (
        "👤 <b>My account</b>\n\n"
        "Available credits: <b>{balance}</b>\n"
        "Reserved credits: {reserved}\n"
        "Plan: {plan}\n"
        "Member since: {since}\n"
        "Reference: <code>{ref}</code> (give it to support)\n\n"
        "{profile}"
    ),
    "plan_free": "Free",
    "profile_summary": "Country: {country}\nGrade: {grade}\nTrack: {series}",
    "profile_not_set": "not set",
    "buy_credits_unavailable": "Credit top-ups and subscriptions will be available soon.",
    "delete_confirm": (
        "⚠️ Deleting your account erases your profile, your history and your documents. Your "
        "remaining credits will be lost. This cannot be undone. Confirm?"
    ),
    "delete_done": "Your account has been deleted. You can come back any time with /start.",
    "preferences_title": "⚙️ <b>Preferences</b> — what would you like to change?",
    "help": (
        "❓ <b>Help</b>\n\n"
        "• Send a photo or a PDF of an exercise to get a detailed correction.\n"
        "• /menu shows the main menu.\n"
        "• /account shows your credits.\n"
        "• /history shows your corrections.\n"
        "• /help shows this message.\n\n"
        "Corrections are produced by artificial intelligence and checked automatically. They "
        "may still contain mistakes: always compare with your lessons and ask your teacher."
    ),
    "support_prompt": (
        "💬 Write your message in one go (problem, question…). The team will answer here. Do not "
        "include personal information (phone number, address…)."
    ),
    "support_received": "Thank you, your message was sent to the team (reference {ref}).",
    "support_forward": "🆘 Ticket #{ref}\nStudent: {user_ref}\n\n{message}",
    "support_reply": "💬 <b>Support reply</b> (ticket #{ref}):\n\n{message}",
    "credits_gift": "🎁 The team gave you {amount} credit(s). New balance: {balance}.",
    "admin_home": "🛠 <b>Administration</b>",
    "btn_admin_stats": "📊 Statistics",
    "btn_admin_tickets": "🆘 Open tickets ({count})",
    "btn_admin_credits": "➕ Add credits",
    "btn_admin_reply": "✍️ Reply",
    "btn_admin_close": "✅ Close ticket",
    "btn_admin_gift": "🎁 Give credits",
    "btn_admin_home": "🛠 Administration",
    "btn_confirm": "✅ Confirm",
    "btn_main_menu": "🏠 Main menu",
    "admin_stats": (
        "📊 <b>Statistics</b>\n\n"
        "Sign-ups: <b>{users}</b> (profile completed: {onboarded})\n"
        "New: {new_24h} in 24 h · {new_7d} in 7 days\n"
        "Active over 7 days: {active_7d}\n"
        "Open tickets: {open_tickets}\n"
        "Credits held by students: {credits}\n"
        "Jobs over 7 days: {jobs}"
    ),
    "admin_none": "none",
    "admin_tickets_title": "🆘 <b>Open tickets</b> ({total})",
    "admin_tickets_empty": "No open ticket 🎉",
    "admin_ticket_line": "• <b>#{ref}</b> — {date} — {excerpt}",
    "admin_ticket": (
        "🆘 <b>Ticket #{ref}</b> — {date}\n"
        "Student: <code>{user_ref}</code> · {balance} credit(s)\n"
        "{profile}\n\n{message}"
    ),
    "admin_ticket_done": "This ticket has already been handled.",
    "admin_reply_prompt": (
        "✍️ Write your reply to ticket #{ref} in a single message. It will be sent to the "
        "student, then the ticket will be closed."
    ),
    "admin_reply_sent": "Reply sent ✅ Ticket #{ref} is closed.",
    "admin_reply_failed": (
        "⚠️ Reply not delivered: the student may have blocked the bot or deleted their account. "
        "The ticket stays open."
    ),
    "admin_ticket_closed": "Ticket #{ref} closed ✅",
    "admin_credit_prompt": (
        "➕ Send the student's reference (8 characters, shown in their “My account” screen and on "
        "their tickets)."
    ),
    "admin_user_not_found": "No student found with reference “{ref}”. Check it and send it again.",
    "admin_user_card": (
        "👤 Student <code>{user_ref}</code>\n"
        "Joined on {since} · {balance} credit(s)\n"
        "{profile}\n\n"
        "How many credits to add?"
    ),
    "admin_grant_confirm": "Add <b>{amount}</b> credit(s) to student <code>{user_ref}</code>?",
    "admin_grant_done": "✅ {amount} credit(s) added. Student's new balance: {balance}.",
    "admin_grant_expired": "This operation has expired or was already done.",
    "admin_new_ticket": "🆘 New ticket #{ref}: {excerpt}\n\nType /admin to reply.",
    "rate_limited": "Easy 🙂 You are sending a lot of messages. Try again in {seconds} s.",
    "unknown_input": "I did not understand. Send a photo of an exercise or use the menu.",
    "error_generic": "Oops, something went wrong. Please try again in a moment.",
    "account_suspended": (
        "Your account is suspended. Contact support if you think this is a mistake."
    ),
    "step_expired": "This step is no longer valid, let's start again.",
    "cmd_start": "Start",
    "cmd_menu": "Main menu",
    "cmd_account": "My account and credits",
    "cmd_history": "My corrections",
    "cmd_help": "Help",
}

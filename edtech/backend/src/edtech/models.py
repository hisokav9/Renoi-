"""Import every model so ``Base.metadata`` is complete (Alembic, tests)."""

from edtech.infra.db import Base
from edtech.modules.audit.models import AuditLog
from edtech.modules.auth.models import RefreshToken
from edtech.modules.credits.models import CreditAccount, CreditTransaction
from edtech.modules.curriculum.models import (
    Country,
    CurriculumProgram,
    GradeLevel,
    Series,
    Subject,
)
from edtech.modules.jobs.models import Job, JobEvent
from edtech.modules.support.models import SupportTicket
from edtech.modules.users.models import AuthIdentity, User

__all__ = [
    "AuditLog",
    "AuthIdentity",
    "Base",
    "Country",
    "CreditAccount",
    "CreditTransaction",
    "CurriculumProgram",
    "GradeLevel",
    "Job",
    "JobEvent",
    "RefreshToken",
    "Series",
    "Subject",
    "SupportTicket",
    "User",
]

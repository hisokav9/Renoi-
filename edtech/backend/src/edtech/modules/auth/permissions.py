"""Role-based access control. Routes check permissions, never role names directly."""

from __future__ import annotations

from enum import StrEnum

from edtech.modules.users.models import UserRole


class Permission(StrEnum):
    PROFILE_MANAGE_OWN = "profile:manage_own"
    JOBS_READ_OWN = "jobs:read_own"
    JOBS_READ_ANY = "jobs:read_any"
    JOBS_REVIEW = "jobs:review"
    USERS_READ_ANY = "users:read_any"
    USERS_MANAGE_ROLES = "users:manage_roles"
    CREDITS_GRANT = "credits:grant"
    SUPPORT_READ = "support:read"
    CURRICULUM_WRITE = "curriculum:write"


_BASE = frozenset({Permission.PROFILE_MANAGE_OWN, Permission.JOBS_READ_OWN})

ROLE_PERMISSIONS: dict[UserRole, frozenset[Permission]] = {
    UserRole.STUDENT: _BASE,
    UserRole.TEACHER: _BASE,
    UserRole.SCHOOL_ADMIN: _BASE,
    UserRole.REVIEWER: _BASE | {Permission.JOBS_READ_ANY, Permission.JOBS_REVIEW},
    UserRole.SUPPORT: _BASE
    | {Permission.JOBS_READ_ANY, Permission.USERS_READ_ANY, Permission.SUPPORT_READ},
    UserRole.ADMIN: frozenset(Permission),
}


def roles_with(permission: Permission) -> list[UserRole]:
    return [role for role, permissions in ROLE_PERMISSIONS.items() if permission in permissions]


def has_permission(role: str, permission: Permission) -> bool:
    try:
        return permission in ROLE_PERMISSIONS[UserRole(role)]
    except ValueError:
        return False

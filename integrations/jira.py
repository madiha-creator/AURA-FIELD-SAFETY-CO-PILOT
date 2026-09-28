"""
INT-001/002/003/004: Jira Integration Stub

Structured writes to Jira when configured.

TODO: Replace with real Jira API integration when credentials provided.
- Jira project key (e.g., SAF, OPS, INC)
- Issue type names (e.g., "Near Miss Report", "Maintenance Task")
- Field IDs (e.g., customfield_10001 for location, etc.)
- Authentication method (API token, OAuth2, etc.)

Current implementation uses placeholder field names matching UI contract.
"""

from typing import Optional
from integrations.database import DatabaseInterface
from backend.config import get_config


class JiraClient:
    """Jira integration client - stub until real schema provided."""

    def __init__(self):
        config = get_config()
        self.available = False  # Stub until real integration

    def log_maintenance_entry(
        self,
        location: str,
        equipment: str,
        issue_description: str,
        severity: str = "medium",
        provenance: Optional[dict] = None,
        worker_id: str = "",
    ) -> str:
        if not self.available:
            raise RuntimeError(
                "Jira integration not configured. Provide real credentials and schema."
            )
        raise NotImplementedError("Jira integration stub - provide real implementation")

    def create_report(
        self,
        location: str,
        equipment: str,
        hazard_type: str,
        injury: str,
        narrative: str = "",
        provenance: Optional[dict] = None,
        idempotency_key: str = "",
        worker_id: str = "",
    ) -> str:
        if not self.available:
            raise RuntimeError(
                "Jira integration not configured. Provide real credentials and schema."
            )
        raise NotImplementedError("Jira integration stub - provide real implementation")

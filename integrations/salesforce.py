"""
INT-001: Salesforce Integration Stub

Structured write to Salesforce when configured.

TODO: Replace with real Salesforce API integration when credentials provided.
- Salesforce object API names (e.g., Near_Miss_Report__c, Maintenance_Entry__c)
- Field API names (e.g., Location__c, Equipment__c, Hazard_Type__c, Injury__c)
- Authentication method (OAuth2 username/password/connected app)
- Field-level security / validation rules

Current implementation uses placeholder field names matching UI contract.
"""

from typing import Optional
from integrations.database import DatabaseInterface
from backend.config import get_config


class SalesforceClient:
    """Salesforce integration client - stub until real schema provided."""

    def __init__(self):
        config = get_config()
        self.username = getattr(config, "SALESFORCE_USERNAME", "")
        self.password = getattr(config, "SALESFORCE_PASSWORD", "")
        self.security_token = getattr(config, "SALESFORCE_SECURITY_TOKEN", "")

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
                "Salesforce integration not configured. Provide real Salesforce credentials and schema mapping."
            )
        raise NotImplementedError("Salesforce integration stub - provide real implementation")

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
                "Salesforce integration not configured. Provide real Salesforce credentials and schema mapping."
            )
        raise NotImplementedError("Salesforce integration stub - provide real implementation")

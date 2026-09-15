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
from .database import DatabaseInterface
from ..core.config import get_config


class SalesforceClient:
    """Salesforce integration client - stub until real schema provided."""

    def __init__(self):
        config = get_config()
        self.username = config.SALESFORCE_USERNAME
        self.password = config.SALESFORCE_PASSWORD
        self.security_token = config.SALESFORCE_SECURITY_TOKEN

        # TODO: Initialize Salesforce connection only when real credentials available
        # self.client = None
        # if all([self.username, self.password, self.security_token]):
        #     self.client = SalesforceConnector(...)

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
        """Write structured maintenance entry to Salesforce.

        TODO: Replace Salesforce API call with real integration.
        Field names below are UI contract placeholders, NOT Salesforce field API names.

        Salesforce schema needed:
        - Object: e.g., Maintenance_Entry__c
        - Fields: Location__c, Equipment__c, Issue_Description__c, Severity__c,
                  Provenance__c (JSON), Worker__c (lookup), CreatedDate
        """
        if not self.available:
            raise RuntimeError(
                "Salesforce integration not configured. "
                "Provide real Salesforce credentials and schema mapping."
            )

        # TODO: Real Salesforce API call here
        # Salesforce SDK: simple_salesforce, Salesforce REST API, etc.
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
        """Write near-miss report to Salesforce.

        Salesforce schema needed:
        - Object: e.g., Near_Miss_Report__c
        - Fields: Location__c, Equipment__c, Hazard_Type__c, Injury__c,
                  Narrative__c, Provenance__c (JSON), Idempotency_Key__c,
                  Worker__c (lookup), Status__c (awaiting_review/in_progress/approved/rejected),
                  CreatedDate
        """
        if not self.available:
            raise RuntimeError(
                "Salesforce integration not configured. "
                "Provide real Salesforce credentials and schema mapping."
            )
        raise NotImplementedError("Salesforce integration stub - provide real implementation")
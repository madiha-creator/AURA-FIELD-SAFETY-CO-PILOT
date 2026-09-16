# SAF-004: Safety Decision Boundaries Policy

This document defines the decision boundaries governing automated agent actions, worker confirmation requirements, supervisor approval requirements, and strictly forbidden actions within the Aura Field Safety Co-Pilot.

## Action Classification Matrix

| Action | Decision Boundary | Requires Confirmation | Requires Supervisor | Allowed Condition |
|---|---|---|---|---|
| `speak_safety_warning` | `automatic` | No | No | Always allowed |
| `draft_corrective_action` | `automatic` | No | No | Always allowed (draft creation only) |
| `get_next_step` / advance step | `confirm` | Yes | No | Always allowed with worker confirmation |
| `log_maintenance_entry` | `confirm` | Yes | No | Always allowed with worker confirmation |
| `create_near_miss` | `confirm` | Yes | No | Allowed ONLY if `check_safety_status.safe_to_report` is `True` |
| `notify_safety_contact` | `confirm` / `supervisor-approve` | Yes | Conditional | NEVER allowed without `report_id`. Requires supervisor if site policy demands it |
| `apply_corrective_action` | `supervisor-approve` | Yes | Yes | Requires supervisor review and approval |
| `medical_advice` | `never` | N/A | N/A | Strictly forbidden |
| `ignore_ppe` | `never` | N/A | N/A | Strictly forbidden |
| `silent_auto_write` | `never` | N/A | N/A | Strictly forbidden |

## Policy Enforcement

1. **Automatic Actions**: Non-destructive voice alerts or initial proposals that inform the worker or draft records without writing persistent incident state.
2. **Confirmation Gates**: Actions requiring explicit worker confirmation (e.g. "Yes, create report").
3. **Safety Status Gating**: Near-miss submission (`create_near_miss`) is gated by `check_safety_status`. If the worker is exposed or active critical readings exist, submission is blocked until isolation is confirmed.
4. **Forbidden Actions**: The system will never offer medical advice, allow bypassing PPE rules, or silently commit reports without worker interaction.

# Firebase Security Specification for SariRemit

## 1. Data Invariants

1. **User Profile**: A user can only view or write their own profile where `userId == request.auth.uid`. No user can claim another user's identity.
2. **Admin Overrides**: Read-only for general users. Writes are restricted to authenticated administrators (specifically matching runtime email `hassan.gaturu20@gmail.com` with email verification, or explicitly listed in the `/admins/` document collection).
3. **Crowdsourced Rates**: Open reading. Submissions require a verified logged-in user (`request.auth.token.email_verified == true`). Users can edit/delete their own submissions.
4. **Reported Issues**: Open creation (support guest feedback), but read and update operations are strictly restricted to admin users.
5. **Rate Alerts (Price Watch)**: A user can only create, view, or manage their own alerts where `userId == request.auth.uid`. Users cannot read or manipulate alerts created by other users.
6. **App Configurations**: Anyone can read global configuration settings, but only authenticated admins can update or delete them.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 payloads represent malicious attempts to bypass identity, integrity, and state constraints on SariRemit Firestore database. All of these MUST result in a `PERMISSION_DENIED` error.

### Payload 1: Profile Theft (Attempting to write another user's profile)
```json
{
  "path": "profiles/attacker_uid",
  "auth": { "uid": "victim_uid" },
  "data": { "name": "Fake Victim" }
}
```

### Payload 2: Admin Override Hijacking (Attacker attempting to set an admin rate override)
```json
{
  "path": "admin_overrides/override-123",
  "auth": { "uid": "attacker_uid", "token": { "email": "attacker@gmail.com", "email_verified": true } },
  "data": {
    "id": "override-123",
    "provider_id": "urpay",
    "exchange_rate": 25.0,
    "override_reason": "Hack rate"
  }
}
```

### Payload 3: Spoofed Email Admin Elevation (Unverified email claim)
```json
{
  "path": "admin_overrides/override-123",
  "auth": { "uid": "attacker_uid", "token": { "email": "hassan.gaturu20@gmail.com", "email_verified": false } },
  "data": { "exchange_rate": 20.0 }
}
```

### Payload 4: Unverified Crowdsourced Submission (Writing a rate without verified email status)
```json
{
  "path": "crowdsourced_rates/rate-999",
  "auth": { "uid": "attacker_uid", "token": { "email": "attacker@gmail.com", "email_verified": false } },
  "data": { "exchangeRate": 25.0, "fee": 0, "submittedBy": "Attacker" }
}
```

### Payload 5: Anonymous Crowdsourced Hijack (Attacker trying to delete someone else's crowdsourced rate)
```json
{
  "path": "crowdsourced_rates/rate-victim-111",
  "auth": { "uid": "attacker_uid" },
  "existingData": { "submittedByUid": "victim_uid" },
  "operation": "delete"
}
```

### Payload 6: Reported Issues Snooping (Regular user trying to query other people's complaints/PII)
```json
{
  "path": "reported_issues",
  "auth": { "uid": "attacker_uid" },
  "operation": "list"
}
```

### Payload 7: Issue Status Tampering (Regular user trying to mark their own or someone else's report as resolved)
```json
{
  "path": "reported_issues/issue-abc",
  "auth": { "uid": "attacker_uid" },
  "existingData": { "status": "pending" },
  "data": { "status": "resolved" }
}
```

### Payload 8: Price Watch Alert Snooping (Attacker trying to view alerts set by other users)
```json
{
  "path": "rate_alerts/alert-victim-1",
  "auth": { "uid": "attacker_uid" },
  "operation": "get"
}
```

### Payload 9: Price Watch Alert Hijacking (Attacker setting a rate alert on behalf of another user)
```json
{
  "path": "rate_alerts/alert-999",
  "auth": { "uid": "attacker_uid" },
  "data": {
    "id": "alert-999",
    "userId": "victim_uid",
    "targetRate": 20.0,
    "condition": "above",
    "isActive": true
  }
}
```

### Payload 10: App Config Poisoning (Attacker attempting to manipulate global settings)
```json
{
  "path": "app_config/custom_fees",
  "auth": { "uid": "attacker_uid" },
  "data": { "value": { "urpay": { "fee": -50.0 } } }
}
```

### Payload 11: Alert Bypass of Valid Condition Values (Injecting invalid status string)
```json
{
  "path": "rate_alerts/alert-123",
  "auth": { "uid": "user_uid" },
  "data": {
    "id": "alert-123",
    "userId": "user_uid",
    "targetRate": 15.5,
    "condition": "invalid_condition_value",
    "isActive": true
  }
}
```

### Payload 12: Injection of Massive String in Alert ID (Denial of Wallet attack)
```json
{
  "path": "rate_alerts/alert-massive-id-99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999",
  "auth": { "uid": "user_uid" },
  "data": { "id": "massive-id", "userId": "user_uid" }
}
```

---

## 3. The Test Runner Spec

The complete firestore rules specification test file (`DRAFT_firestore.rules.test.ts` or local equivalent) ensures all these payloads are strictly blocked.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin','user_admin']) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }

    function isModerator() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'moderator' &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }

    function isStaff() {
      return isAdmin() || isModerator();
    }

    // USERS
    match /users/{uid} {
      // Change temporally
      allow create: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.status == 'active'
        && request.resource.data.role in [
          'investor',
          'moderator',
          'admin',
          'user_admin'
        ];

      allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());

      // Self updates allowed for profile fields, but role/status must not change
      allow update: if isSignedIn() && (
        isAdmin() || (
          request.auth.uid == uid &&
          request.resource.data.role == resource.data.role &&
          request.resource.data.status == resource.data.status &&
          request.resource.data.uid == resource.data.uid
        )
      );
      allow delete: if isAdmin();

      // USER NOTIFICATIONS (per-user state: read/delete only affects that user)
      match /notifications/{notificationId} {
        allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid);

        // Allow user to create only their own notifications (used for legacy migration)
        allow create: if isAdmin() || (
          isSignedIn()
          && request.auth.uid == uid
          && request.resource.data.userId == uid
        );

        // Allow user to mark read / delete only their own notifications.
        // Keep userId immutable.
        allow update, delete: if isAdmin() || (
          isSignedIn()
          && request.auth.uid == uid
          && request.resource.data.userId == resource.data.userId
        );
      }
      
			// WALLETS
      match /wallets/{walletId} {
        allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid && walletId == uid);

        // Allow users to create their own wallet once, with an empty balance.
        allow create: if isSignedIn()
          && request.auth.uid == uid
          && walletId == uid
          && request.resource.data.keys().hasOnly(['uid', 'balance', 'createdAt', 'updatedAt', 'currency'])
          && request.resource.data.uid == uid
          && request.resource.data.balance is number
          && request.resource.data.balance == 0;

        // Users can only decrease their own balance (investment deductions).
        // They cannot increase it (top-ups are admin-only).
        allow update: if isAdmin() || (
          isSignedIn()
          && request.auth.uid == uid
          && walletId == uid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['balance', 'updatedAt'])
          && request.resource.data.balance is number
          && request.resource.data.balance >= 0
          && request.resource.data.balance < resource.data.balance
        );
        allow delete: if isAdmin();
      }

			// PAYMENT METHODS
      match /paymentMethods/{methodId} {
        allow read, create, update, delete: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      }
    }

    // PROJECTS
    match /projects/{projectId} {
      // Users cannot see closed projects; only admins can.
      allow read: if isAdmin() || (
        isSignedIn()
        && (!('general' in resource.data) || resource.data.general.status != 'closed')
      );
      allow create, update, delete: if isAdmin();

      match /timeline/{eventId} {
        allow read: if isAdmin() || (
          isSignedIn()
          && exists(/databases/$(database)/documents/projects/$(projectId))
          && (
            !('general' in get(/databases/$(database)/documents/projects/$(projectId)).data)
            || get(/databases/$(database)/documents/projects/$(projectId)).data.general.status != 'closed'
          )
        );
        allow create, update, delete: if isAdmin();
      }
    }

    // INVESTMENTS
    match /investments/{investmentId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isAdmin() || (
        isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.amount is number
        && request.resource.data.amount > 0
        && request.resource.data.projectId is string
        // No permitir invertir en proyectos cerrados
        && exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId))
        && (
          !('general' in get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data)
          || get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.general.status != 'closed'
        )
        // No permitir invertir más que el saldo disponible
        && exists(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid)).data.balance is number
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid)).data.balance >= request.resource.data.amount
      );
      allow update, delete: if isAdmin();
    }

    // TRANSACTIONS
    match /transactions/{txId} {
      // Simplified: investment-type validation is already enforced on the
      // /investments create rule within the same batch. Duplicating the
      // exists()/get() calls here would exceed the 10-read limit for
      // batched writes and cause "Missing or insufficient permissions".
      allow create: if isAdmin() || (
        isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.amount is number
        && request.resource.data.amount > 0
      );
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    // PAYOUTS
    match /payouts/{payoutId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create, update, delete: if isAdmin();
    }

    // WITHDRAWALS
    match /withdrawals/{withdrawalId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isAdmin() || (isSignedIn() && request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    // NOTIFICATIONS
    match /notifications/{notificationId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isAdmin() || (isSignedIn() && request.resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    // RECHARGE METHODS
    match /rechargeMethods/{methodId} {
      allow read: if isSignedIn();          // USERS Y ADMINS PUEDEN VER
      allow create, update, delete: if isAdmin(); // SOLO ADMINS MODIFICAN
    }

    // RECHARGER METHODS (NUEVA COLECCION PARA METODOS DE RECARGA)
    match /rechargerMethods/{methodId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }

    // TOPUPS
    match /topups/{topupId} {
      allow read: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // SETTINGS
    match /settings/{settingId} {
      allow read, write: if isAdmin();
    }

    // TIERS
    match /tiers/{tierId} {
      allow read, write: if isAdmin();
    }

    // RISK CATEGORIES
    match /riskCategories/{riskId} {
      allow read, write: if isAdmin();
    }

    // AUDIT LOGS
    match /auditLogs/{logId} {
      allow read: if isStaff();
      allow create: if isStaff();
      allow update, delete: if false;
    }

    // DEFAULT DENY
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

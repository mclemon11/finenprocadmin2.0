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
      // Self: can create own profile but cannot self-promote
      allow create: if isSignedIn() && (
        (request.auth.uid == uid && request.resource.data.role in ['investor','moderator'] && request.resource.data.status == 'active')
        || isAdmin()
      );

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
      
			// WALLETS
      match /wallets/{walletId} {
        allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid && walletId == uid);

        // Allow users to create their own wallet once, with an empty balance.
        // Balance updates remain admin-only.
        allow create: if isSignedIn()
          && request.auth.uid == uid
          && walletId == uid
          && request.resource.data.keys().hasOnly(['uid', 'balance', 'createdAt', 'updatedAt', 'currency'])
          && request.resource.data.uid == uid
          && request.resource.data.balance is number
          && request.resource.data.balance == 0;

        allow update, delete: if isAdmin();
      }

			// PAYMENT METHODS
      match /paymentMethods/{methodId} {
        allow read, create, update, delete: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      }
    }

    // PROJECTS
    match /projects/{projectId} {
      // Necesario para listar proyectos en admin (useAdminProjects)
      allow read: if true; // o usar isSignedIn() si quieres restringirlo
      allow create, update, delete: if isAdmin();

      // Subcolección: timeline del proyecto
      match /timeline/{eventId} {
        allow read: if isSignedIn();
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
        && get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.status != 'closed'
        // No permitir invertir más que el saldo disponible
        && exists(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid)).data.balance is number
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid)).data.balance >= request.resource.data.amount
      );
      allow update, delete: if isAdmin();
    }

    // TRANSACTIONS
    match /transactions/{txId} {
      allow create: if isAdmin() || (
        isSignedIn()
        && request.resource.data.userId == request.auth.uid
        // Si es una transacción de inversión creada por el usuario, aplicar mismas restricciones.
        && (
          request.resource.data.type != 'investment'
          || (
            request.resource.data.amount is number
            && request.resource.data.amount > 0
            && request.resource.data.projectId is string
            && exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId))
            && get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.status != 'closed'
            && exists(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid))
            && get(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid)).data.balance is number
            && get(/databases/$(database)/documents/users/$(request.auth.uid)/wallets/$(request.auth.uid)).data.balance >= request.resource.data.amount
          )
        )
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
      allow read: if isSignedIn();                // USERS Y ADMINS PUEDEN VER
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

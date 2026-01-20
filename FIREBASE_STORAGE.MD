rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        firestore.exists(/databases/(default)/documents/users/$(request.auth.uid)) &&
        (firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ["admin","user_admin"]) &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.status == "active";
    }

    function projectIsVisible(projectId) {
      return firestore.exists(/databases/(default)/documents/projects/$(projectId))
        && firestore.get(/databases/(default)/documents/projects/$(projectId)).data.status != "closed";
    }

    // TOPUPS (COMPROBANTES DE RECARGA) - RUTA LEGACY
    match /topups/{uid}/{allPaths=**} {
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      allow write: if isSignedIn() && request.auth.uid == uid;
    }

    // TOPUPS (COMPROBANTES DE RECARGA) - RUTA ACTUAL USADA POR LA APP
    match /topupProofs/{uid}/{allPaths=**} {
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid);

      // Limitar tamaño y tipos permitidos (imágenes o PDF)
      allow write: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.size < 10 * 1024 * 1024
        && (
          request.resource.contentType.matches('image/.*')
          || request.resource.contentType == 'application/pdf'
        );
    }

    //  PROJECT IMAGES 
    match /projects/{projectId}/images/{allPaths=**} {
      allow read: if isAdmin() || (isSignedIn() && projectIsVisible(projectId));
      allow write: if isAdmin()
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    // INVESTMENT PROOFS
    match /investments/{investmentId}/proofs/{file} {
      allow read: if isAdmin() || isSignedIn();
      allow write: if isSignedIn();
    }

    //  LEGACY INVESTMENT PROOFS
    match /investment-proofs/{uid}/{allPaths=**} {
      allow read: if isAdmin() || (isSignedIn() && request.auth.uid == uid);
      allow write: if isSignedIn() && request.auth.uid == uid;
    }

    //  PAYOUT PROOFS
    match /payouts/{payoutId}/proofs/{file} {
      allow read, write: if isAdmin();
    }

    //  WITHDRAWAL PROOFS
    match /withdrawals/{withdrawalId}/proofs/{file} {
      allow read: if isAdmin() || isSignedIn();
      allow write: if isAdmin();
    }

    //  KYC
    match /users/{uid}/kyc/{file} {
      allow read: if request.auth.uid == uid || isAdmin();
      allow write: if request.auth.uid == uid;
    }

    //  FALLBACK GENERAL USER FILES 
    match /users/{uid}/{allPaths=**} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if isSignedIn() && request.auth.uid == uid;
    }

    //  DEFAULT DENY
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
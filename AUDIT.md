# Audit Technique : Famille DZ en Or

**Date :** 27 Mai 2024
**Statut :** 🔴 **NO-GO**

Ce document présente un audit exhaustif de l'application "Famille DZ en Or". La recommandation actuelle est un **NO-GO** pour la mise en production en l'état, principalement en raison de failles de sécurité critiques et de problèmes de fiabilité des données.

---

## 1. 🚨 Sécurité (Critique)

### 1.1. Code PIN Admin en Dur (Hardcoded)
**Sévérité :** 🔴 Critique
**Description :** Le code PIN d'administration `2985` est écrit en dur dans le fichier `App.tsx`.
**Risque :** Tout utilisateur ayant accès au code source (ou capable d'inspecter les sources JS dans le navigateur si les sourcemaps sont activées ou le code non obfusqué) peut devenir administrateur et prendre le contrôle du live.
**Recommandation :** Utiliser des variables d'environnement (`VITE_ADMIN_PIN`) et idéalement gérer l'authentification admin via Supabase Auth (rôles) plutôt qu'un simple PIN côté client.

### 1.2. Absence de RLS (Row Level Security)
**Sévérité :** 🔴 Critique
**Description :** Le script `scripts/init-db.mjs` désactive explicitement la sécurité au niveau des lignes (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY`).
**Risque :** N'importe quel utilisateur disposant de la clé publique `anon` (qui est exposée dans le client) peut lire, modifier ou supprimer **toutes** les données de la base de données (scores, équipes, questions). Un utilisateur malveillant peut réinitialiser le jeu ou tricher.
**Recommandation :** Activer RLS. Créer des politiques strictes : lecture pour tous, écriture uniquement pour l'admin (host) ou via des RPC (Remote Procedure Calls) sécurisés.

### 1.3. Logique de Jeu Côté Client
**Sévérité :** 🟠 Majeure
**Description :** Toute la logique du jeu (`handleAction` dans `App.tsx`) est exécutée côté client.
**Risque :** Un utilisateur peut modifier l'état local ou intercepter/modifier les requêtes vers Supabase pour s'attribuer des points.
**Recommandation :** Déplacer la logique critique (validation des réponses, attribution des points) côté serveur (Supabase Edge Functions) ou valider strictement les entrées avec les politiques RLS.

---

## 2. 💾 Fiabilité & Concurrence

### 2.1. Conditions de Course (Race Conditions)
**Sévérité :** 🟠 Majeure
**Description :** La mise à jour de l'état du jeu suit le pattern : `Lecture` -> `Modification` -> `Écriture` (`localDB.getState()` ... `localDB.saveState()`).
**Risque :** Si deux utilisateurs (ou l'admin et un joueur) effectuent une action simultanément, la dernière écriture écrasera la précédente sans prendre en compte les changements intermédiaires. Cela peut entraîner des pertes de données (ex: un joueur rejoint une équipe mais disparait aussitôt car l'admin a mis à jour le score en même temps).
**Recommandation :** Utiliser des mises à jour atomiques SQL ou des Edge Functions pour les mutations d'état. Utiliser Supabase Realtime avec des "presence states" pour la gestion des joueurs.

---

## 3. 🏗 Architecture & Qualité du Code

### 3.1. "God Component" (App.tsx)
**Sévérité :** 🟡 Moyenne
**Description :** Le fichier `App.tsx` contient presque toute l'application : routage, authentification, logique métier (`handleAction`), et composants UI (`GamePage`, `TeamEditSection`).
**Risque :** Code difficile à maintenir, à tester et à faire évoluer. Lisibilité réduite.
**Recommandation :** Refactoriser en extrayant les composants dans des fichiers dédiés (`components/`) et la logique métier dans des "hooks" personnalisés (ex: `useGameLogic`).

### 3.2. Questions en Dur
**Sévérité :** 🟡 Moyenne
**Description :** Les questions sont définies dans `constants.tsx`.
**Risque :** Impossible d'ajouter ou modifier des questions sans redéployer l'application.
**Recommandation :** Stocker les questions en base de données (table `questions`) et créer une interface d'administration pour les gérer.

### 3.3. Dépendances
**Sévérité :** 🟢 Faible
**Description :** Utilisation de versions récentes (React 19).
**Risque :** React 19 est très récent (potentiellement en RC/Beta selon la date exacte de sortie de la version utilisée). Risque d'instabilité ou d'incompatibilité avec certaines librairies.
**Recommandation :** Vérifier la compatibilité de `swr` et `framer-motion` avec React 19.

---

## 4. 🧪 Tests

### 4.1. Absence de Tests Automatisés
**Sévérité :** 🔴 Critique
**Description :** Aucune suite de tests (unitaire ou E2E) n'est présente ou active dans le projet, malgré la présence de `test-results` et `@playwright/test`.
**Risque :** Régressions fréquentes lors des modifications. Impossible de garantir le bon fonctionnement avant déploiement.
**Recommandation :** Mettre en place des tests E2E critiques (Login Admin, Déroulement d'une manche) avec Playwright.

---

## Conclusion

Le projet est une preuve de concept (POC) fonctionnelle mais ne respecte pas les standards de sécurité et de robustesse nécessaires pour une production, surtout dans un contexte de "Live" où des utilisateurs malveillants peuvent être présents.

**Actions Requises pour le GO :**
1.  **Sécuriser l'admin :** Déplacer le PIN dans les variables d'environnement.
2.  **Activer RLS :** Sécuriser la base de données Supabase.
3.  **Tests :** Ajouter au moins un test de "sanity check".

# Cahier des Charges - Plateforme de Gestion de Campagnes Publicitaires

## Introduction

### Contexte Technologique

**Technologies Principales:**
- HTML5 pour la structure
- CSS3 pour le design et la mise en page
- JavaScript (Vanilla JS) pour l'interactivité et les fonctionnalités dynamiques

## Front-End

### 1. Dashboard Administrateur

#### Objectifs
- Interface de visualisation des campagnes
- Gestion des dispositifs connectés

### 2. Gestionnaire de Devices

#### Objectifs
- Liste et détails des dispositifs
- Identifiant unique par device

#### Fonctionnalités
- Inventaire complet des dispositifs
- Génération et gestion des identifiants uniques
- Possibilité de grouper et catégoriser les devices

### 3. Interface de Création de Campagnes

#### Objectifs
- Formulaire de configuration
- Sélection des devices cibles

#### Fonctionnalités
- Création intuitive de nouvelles campagnes
- Paramétrage détaillé (durée, contenu)
- Sélection multiple de devices
- Prévisualisation avant publication

### 4. Écran de Diffusion (Device)

#### Objectifs
- Récupération dynamique du contenu de campagne
- Affichage adaptatif selon configuration

#### Fonctionnalités
- Chargement intelligent des campagnes
- Adaptation automatique du contenu
- Gestion des priorités de diffusion

## Back-End

### 1. Système d'Authentification

#### Objectifs
- Gestion des comptes admin
- Contrôle des permissions

#### Fonctionnalités
- Authentification sécurisée
- Gestion des rôles et droits

### 2. API de Gestion des Devices

#### Objectifs
- CRUD des dispositifs
- Mapping des campagnes aux devices

#### Fonctionnalités
- Création de nouveaux devices
- Mise à jour des informations
- Suppression de devices
- Association dynamique des campagnes

### 3. Service de Campagnes

#### Objectifs
- Création, modification, suppression
- Logique de diffusion conditionnelle

#### Fonctionnalités
- Gestion complète du cycle de vie des campagnes
- Règles de diffusion paramétrables

## Gestion Utilisateurs

### Création et Gestion des Comptes

- Création/suppression de comptes
- Système de permissions granulaires
- Différents niveaux d'accès :
  * Administrateur
  * Créateur de campagne

## Gestion des Devices

### Identifiant Unique

- Ajout d'ID dans l'interface front-end des devices
- Permettre la segmentation précise des campagnes

### Workflow de Diffusion

#### Processus de Récupération de Contenu
- Requêtes back-end pour déterminer le contenu à afficher
- Récupération dynamique :
  * Contenu de la campagne
  * Durée de diffusion

## Fonctionnalités Avancées

### Prévisualisation des Campagnes
- Simulation de diffusion
- Vérification avant publication

### Règles de Diffusion
- Planification horaire
- Priorisation des campagnes

## Contraintes Techniques

- Gestion des permissions par rôle
- Responsive design
- Scalabilité

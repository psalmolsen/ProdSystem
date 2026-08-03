# SKILLS.md

# ProdSystem Development Skills & Architecture

## Project Overview

ProdSystem is an inventory and operations management system built for CCB.

Current frontend stack:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Firebase Hosting (deployment)

Current backend plan:

- Google Apps Script
- Google Sheets as database
- REST API exposed from Apps Script

---

# Architecture

Frontend

React
↓
API Service Layer
↓
Google Apps Script
↓
Google Sheets

The frontend must NEVER communicate with Google Sheets directly.

All communication goes through the centralized API layer.

---

# Deployment

Hosting:

Firebase Hosting

CI/CD:

GitHub Actions

Workflow:

Push to main
↓

npm ci

↓

npm run build

↓

Firebase Hosting Deploy

Production URL:

https://prodsystem-488bf.web.app

---

# Project Goals

The application should:

- load quickly
- remain modular
- be easy to maintain
- avoid duplicated business logic
- isolate API code from UI

---

# Folder Responsibilities

src/components

Reusable UI components only.

Never place API logic here.

---

src/pages

Page composition.

Should only orchestrate components.

---

src/services

Contains ALL backend communication.

Example:

services/
    api/
        client.ts
        adapter.ts
        inventory.ts
        cnf.ts
        materials.ts

No component should call fetch() directly.

Always go through services/api.

---

src/hooks

Reusable React hooks.

Business logic belongs here when reusable.

---

src/types

Central location for interfaces and shared types.

---

src/utils

Pure helper functions.

No side effects.

---

# API Rules

Never scatter fetch() calls.

Always use

services/api/client.ts

Example

Page

↓

Inventory Service

↓

API Client

↓

Apps Script

↓

Google Sheets

---

# UI Rules

Maintain consistent spacing.

Avoid inline styles.

Prefer Tailwind utilities.

Create reusable components before duplicating JSX.

---

# State Management

Prefer:

React Query
or

Context API

Avoid unnecessary global state.

Keep page-local state local.

---

# Error Handling

Every API request must

try

catch

return typed errors

Never silently ignore errors.

---

# TypeScript Rules

Avoid "any".

Prefer interfaces.

Export reusable types.

Keep strict typing enabled.

---

# Environment Variables

Frontend variables must begin with

VITE_

Example

VITE_API_BASE_URL

Never expose secrets.

Secrets belong only in:

GitHub Secrets

Firebase Secrets

Apps Script

Never commit secrets to Git.

---

# Firebase

Firebase only hosts the frontend.

Firebase is NOT the database.

Firebase is NOT responsible for business logic.

---

# Google Apps Script

Acts as REST API.

Responsibilities

- CRUD
- validation
- spreadsheet operations
- formatting
- business rules

Apps Script owns database logic.

React owns presentation.

---

# Google Sheets

Google Sheets is the persistence layer.

Spreadsheet structure is considered part of the backend contract.

Do not modify columns without updating Apps Script.

---

# Coding Standards

Prefer

const

over

let

Prefer

arrow functions

Prefer early returns.

Keep functions small.

Single responsibility.

---

# Component Guidelines

Good

InventoryTable

InventoryFilters

InventorySummary

Bad

BigComponentWithEverything

---

# Naming

Components

PascalCase

InventoryCard.tsx

Hooks

useInventory.ts

Utilities

formatCurrency.ts

Services

inventoryService.ts

Types

Inventory.ts

---

# Performance

Lazy-load routes.

Memoize expensive calculations.

Avoid unnecessary renders.

Avoid duplicate API calls.

---

# Git Workflow

Feature Branch

↓

Commit

↓

Push

↓

Pull Request

↓

Merge to main

↓

Automatic Firebase Deployment

---

# Long-Term Goal

React Frontend

↓

Firebase Hosting

↓

Google Apps Script REST API

↓

Google Sheets

This separation of concerns must always be preserved.

UI changes should never require database changes unless the API contract changes.

Business logic belongs in Apps Script.

Presentation logic belongs in React.
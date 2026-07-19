# System Map

**Project:** VEL Finance  
**Document Version:** 1.0  
**Last Updated:** July 2026

---

# Purpose

This document provides a complete system-level overview of the VEL Finance application.

It explains how each part of the application interacts, how data flows through the system, and how the frontend, backend, and database work together to provide a complete finance management solution.

This document acts as the primary reference for understanding the application's end-to-end architecture.

---

# System Overview

VEL Finance follows a classic three-tier architecture.

```
Presentation Layer
        │
Business Layer
        │
Data Layer
```

Each layer has clearly defined responsibilities.

---

# High-Level System Architecture

```text
                     User
                      │
                      ▼
           React + Vite Frontend
                      │
             Axios HTTP Requests
                      │
                      ▼
               FastAPI Backend
                      │
      Business Logic & Validation
                      │
                      ▼
         Supabase PostgreSQL Database
                      │
                      ▼
              API Response
                      │
                      ▼
               React UI Update
```

---

# Layer Responsibilities

## Presentation Layer

Technology:

- React
- Tailwind CSS
- React Router
- Axios

Responsibilities:

- Display user interface
- Handle navigation
- Collect user input
- Display business information
- Call backend APIs

The frontend never performs financial calculations.

---

## Business Layer

Technology:

- FastAPI
- Pydantic

Responsibilities:

- Validate requests
- Execute business rules
- Calculate loan values
- Process customer payments
- Maintain cashbook
- Generate business summaries
- Interact with the database

The backend is the single owner of business logic.

---

## Data Layer

Technology:

- Supabase
- PostgreSQL

Responsibilities:

- Store customer records
- Store transactions
- Store expenses
- Maintain cashbook
- Store historical data

The database acts as the permanent source of truth.

---

# Complete Request Lifecycle

Every operation follows the same lifecycle.

```text
User Action
      │
      ▼
React Component
      │
      ▼
Service Layer
      │
      ▼
Axios
      │
      ▼
FastAPI Router
      │
      ▼
Pydantic Validation
      │
      ▼
Business Logic
      │
      ▼
Supabase Database
      │
      ▼
Database Response
      │
      ▼
FastAPI Response
      │
      ▼
React State Update
      │
      ▼
UI Refresh
```

This consistent flow improves maintainability and debugging.

---

# Core Business Modules

The application is divided into several business modules.

## Dashboard

Responsibilities:

- Business overview
- Cash summary
- Collections
- Expenses
- Outstanding information

---

## Customer Management

Responsibilities:

- Add customer
- Edit customer
- Activate loan
- Close loan
- Delete customer
- View customer profile

---

## Payment Collection

Responsibilities:

- Record customer payments
- Update outstanding balance
- Update cashbook
- Maintain transaction history

---

## Expense Management

Responsibilities:

- Record expenses
- Update cashbook
- Maintain expense history

---

## Cashbook

Responsibilities:

- Record loan disbursements
- Record customer collections
- Record expenses
- Maintain running cash balance

---

## Business Summary

Responsibilities:

- Calculate profit
- Cash position
- Outstanding amount
- Business performance

---

## History

Responsibilities:

- Daily transaction history
- Expense history
- Cash movement

---

# Data Flow

The frontend communicates exclusively with the backend.

```
React
   │
Services
   │
Axios
   │
FastAPI
   │
Supabase
```

The frontend never communicates directly with the database.

---

# Component Interaction

```text
Pages
   │
   ▼
Feature Components
   │
   ▼
Shared Components
   │
   ▼
Service Layer
```

Responsibilities are distributed to minimize duplication.

---

# Backend Interaction

The backend exposes dedicated routers.

```text
Customers

Transactions

Expenses

Dashboard

History

Business Summary
```

Each router manages a single business domain.

---

# Database Interaction

The backend communicates with the following logical entities.

```text
Customers

Transactions

Expenses

Cashbook
```

Business summaries are generated from stored financial data.

---

# Business Flow Overview

The finance workflow follows a complete customer lifecycle.

```text
Customer Created
        │
        ▼
Loan Activated
        │
        ▼
Cashbook Updated
        │
        ▼
Customer Payments
        │
        ▼
Outstanding Updated
        │
        ▼
Business Summary Updated
        │
        ▼
Loan Closed
```

---

# Design Decisions

The system follows several key architectural decisions.

| Decision | Reason |
|----------|--------|
| Backend owns business logic | Ensures consistent financial calculations |
| Service layer for API communication | Reduces code duplication |
| Component-based UI | Improves maintainability |
| Router-based backend | Supports modular development |
| Supabase as database | Managed PostgreSQL with simple integration |
| Tailwind CSS | Consistent and responsive UI |

---

# System Strengths

The current architecture provides:

- Clear separation of concerns
- Modular frontend
- Modular backend
- Centralized business rules
- Reusable UI components
- Scalable project structure
- Maintainable codebase
- Mobile responsiveness

---

# Scalability

The current architecture supports future expansion.

Potential additions include:

- Authentication
- Multi-user support
- Branch management
- Analytics
- Reports
- Notifications
- Audit logs

The modular design minimizes the impact of future enhancements.

---

# Conclusion

VEL Finance follows a clean three-tier architecture where presentation, business logic, and data persistence are clearly separated.

The frontend focuses on delivering a responsive user experience, the backend centralizes all financial rules, and the database provides a reliable source of truth for business records.

This architecture provides a strong foundation for future enhancements while remaining maintainable, scalable, and suitable for production deployment.

---

**End of Document**
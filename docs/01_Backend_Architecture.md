# Backend Architecture

**Project:** VEL Finance  
**Document Version:** 1.0  
**Last Updated:** July 2026

---

# Purpose

This document describes the architecture of the VEL Finance backend application. It explains how the backend is structured, how requests flow through the system, how business logic is organized, and how the backend communicates with the database.

This document serves as the technical reference for developers working on the backend.

---

# Overview

The VEL Finance backend is built using **FastAPI** and follows a modular architecture that separates API routing, data validation, and database interaction.

The backend is responsible for:

- Processing business logic
- Validating incoming requests
- Managing customer and financial data
- Maintaining the cashbook
- Calculating business summaries
- Communicating with the Supabase PostgreSQL database
- Providing REST APIs for the React frontend

The frontend does not contain business logic. All financial calculations and business rules are handled by the backend.

---

# Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | FastAPI |
| Language | Python |
| Validation | Pydantic |
| Database | Supabase (PostgreSQL) |
| API Style | REST |
| Deployment | Render |

---

# High-Level Architecture

```text
                 React Frontend
                       │
                REST API Requests
                       │
                       ▼
              FastAPI Application
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   Customer API   Transaction API   Expense API
        │              │              │
        └──────────────┼──────────────┘
                       ▼
               Business Logic Layer
                       │
                       ▼
            Supabase PostgreSQL Database
```

---

# Backend Folder Structure

```text
backend/

├── main.py
├── requirements.txt
├── routers/
│   ├── customers.py
│   ├── transactions.py
│   ├── dashboard.py
│   ├── expenses.py
│   ├── history.py
│   └── business_summary.py
│
├── models/
│   ├── customer.py
│   ├── transaction.py
│   └── expense.py
│
├── database/
│   └── supabase.py
│
├── utils/
│
└── .env
```

> *The folder structure may evolve over time as additional modules are introduced.*

---

# Request Lifecycle

Every request follows a consistent processing pipeline.

```text
Client Request
      │
      ▼
FastAPI Router
      │
      ▼
Request Validation (Pydantic)
      │
      ▼
Business Logic
      │
      ▼
Supabase Database
      │
      ▼
Response Generation
      │
      ▼
Client Response
```

This separation ensures that validation, business rules, and persistence remain independent.

---

# API Architecture

The backend follows a **router-based architecture**, where each module is responsible for a specific business domain.

| Router | Responsibility |
|---------|----------------|
| Customers | Customer lifecycle management |
| Transactions | Customer payment collection |
| Expenses | Expense recording |
| Dashboard | Dashboard metrics |
| History | Historical transaction records |
| Business Summary | Financial summaries |

Each router exposes REST endpoints and delegates business operations to the appropriate logic.

---

# Business Logic Architecture

The backend owns all financial calculations and business rules.

Examples include:

- Loan calculations
- Interest calculations
- Outstanding balance calculations
- Cashbook updates
- Profit calculations
- Business summary generation

Keeping business logic on the server ensures consistent behavior regardless of the client application.

---

# Database Architecture

The backend communicates directly with **Supabase PostgreSQL**.

Primary responsibilities include:

- Creating customer records
- Recording transactions
- Recording expenses
- Reading dashboard metrics
- Maintaining cashbook entries
- Generating business summaries

The backend acts as the single source of truth for all data modifications.

---

# Validation Strategy

All incoming requests are validated using **Pydantic models** before business logic is executed.

Validation includes:

- Required fields
- Data types
- Default values
- Request schema validation

This prevents invalid or incomplete data from reaching the database.

---

# Error Handling

The backend follows a consistent error handling strategy.

Typical responses include:

- Invalid request data
- Missing resources
- Database operation failures
- Validation errors

Errors are returned using appropriate HTTP status codes with descriptive messages.

---

# Business Rule Ownership

The backend is responsible for enforcing all financial rules.

Examples include:

- Loan activation
- Payment processing
- Outstanding calculations
- Profit calculations
- Cashbook synchronization

This ensures business rules remain centralized and consistent.

---

# Security Considerations

The backend is designed with the following security practices:

- Environment variables for sensitive configuration
- Server-side validation
- Controlled database access
- REST-based communication
- Separation between frontend and database

Future versions may include authentication and role-based authorization.

---

# Scalability

The modular architecture allows the application to scale by introducing additional routers without affecting existing modules.

Potential future modules include:

- Authentication
- Notifications
- Reports
- User Management
- Analytics
- Audit Logs

The existing architecture supports incremental growth with minimal structural changes.

---

# Design Principles

The backend follows these engineering principles:

- Single Responsibility Principle
- Separation of Concerns
- Backend-owned business logic
- Modular API design
- Reusable validation models
- Maintainable code structure
- RESTful communication

---

# Strengths

The current backend architecture provides:

- Clear separation of responsibilities
- Modular router structure
- Centralized business logic
- Strong request validation
- Scalable project organization
- Clean API design
- Reliable database interaction

---

# Future Improvements

Future versions may include:

- Authentication & Authorization
- Service layer abstraction
- Structured logging
- Background task processing
- Automated testing
- API versioning
- Rate limiting
- Monitoring & observability

These improvements can be introduced without significant architectural changes.

---

# Conclusion

The VEL Finance backend follows a clean, modular architecture that separates routing, validation, business logic, and database interaction. The architecture is designed to be maintainable, scalable, and suitable for production deployment.

By centralizing all business rules within the backend, the application ensures consistent financial calculations, reliable data integrity, and a clear separation between frontend presentation and backend processing.

---

**End of Document**
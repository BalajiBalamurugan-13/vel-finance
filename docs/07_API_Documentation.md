# API Documentation

**Project:** VEL Finance  
**Document Version:** 1.0  
**Last Updated:** July 2026

---

# Purpose

This document provides an overview of the REST APIs exposed by the VEL Finance backend.

The APIs enable communication between the React frontend and the FastAPI backend, allowing users to manage customers, loans, payments, expenses, dashboards, and business reports.

The backend remains the single source of truth for all business logic and financial calculations.

---

# API Architecture

```
React Components
       │
       ▼
Service Layer
       │
       ▼
Axios Client
       │
       ▼
REST API
       │
       ▼
FastAPI Routers
       │
       ▼
Supabase Database
```

---

# API Design Principles

The APIs follow these principles:

- RESTful communication
- JSON request and response bodies
- Backend-owned business logic
- Consistent response structure
- Server-side validation
- Stateless communication

---

# API Modules

The backend exposes APIs grouped by business domain.

| Module | Purpose |
|---------|---------|
| Customer API | Customer lifecycle management |
| Transaction API | Payment collection |
| Expense API | Expense management |
| Dashboard API | Dashboard metrics |
| History API | Historical records |
| Business Summary API | Financial reporting |

---

# Customer API

## Responsibilities

- Create customer
- Update customer
- View customer
- Delete customer
- Activate loan
- Close loan

### Frontend Modules

- Customer List
- Customer Profile
- Add Customer

### Business Rules

- Customer data is validated before saving.
- Loan calculations are performed by the backend.
- Customer lifecycle is centrally managed.

---

# Transaction API

## Responsibilities

- Record customer payment
- Update outstanding amount
- Create transaction history
- Update cashbook

### Frontend Modules

- Customer Profile
- Dashboard
- History

### Business Rules

- Every payment creates a transaction record.
- Cashbook is automatically updated.
- Outstanding balance is recalculated.

---

# Expense API

## Responsibilities

- Record expenses
- Maintain expense history
- Update cashbook

### Frontend Modules

- Add Expense
- Dashboard
- History

### Business Rules

- Expenses reduce available cash.
- Expense history is preserved.
- Cashbook is updated automatically.

---

# Dashboard API

## Responsibilities

Provide dashboard metrics including:

- Collections
- Expenses
- Cash Balance
- Outstanding Amount
- Pending Collections

### Frontend Modules

- Dashboard

---

# History API

## Responsibilities

Provide historical financial records.

Includes:

- Payments
- Expenses
- Cash Movement

### Frontend Modules

- History

---

# Business Summary API

## Responsibilities

Generate financial summaries.

Includes:

- Profit
- Cash Position
- Outstanding
- Business Performance

### Frontend Modules

- Business Summary

---

# Request Lifecycle

Every request follows the same lifecycle.

```
Frontend

↓

Service Layer

↓

Axios

↓

FastAPI Router

↓

Validation

↓

Business Logic

↓

Database

↓

Response

↓

Frontend Update
```

---

# Request Validation

Incoming requests are validated using Pydantic models.

Validation includes:

- Required fields
- Data types
- Default values
- Schema validation

Invalid requests are rejected before business logic executes.

---

# Response Handling

API responses follow a consistent JSON structure.

Typical responses include:

- Successful operation
- Validation error
- Resource not found
- Database error

The frontend interprets these responses and updates the UI accordingly.

---

# Error Handling

The backend returns appropriate HTTP status codes for unsuccessful operations.

Common scenarios include:

- Invalid input
- Missing resources
- Validation failures
- Internal server errors

Frontend components display user-friendly feedback based on these responses.

---

# Security

The APIs are designed with the following security principles:

- Backend validation
- Controlled database access
- Environment-based configuration
- Separation between frontend and database

Future enhancements may include:

- Authentication
- Authorization
- Rate limiting

---

# API Workflow

The APIs collectively support the complete finance lifecycle.

```
Customer

↓

Loan

↓

Cashbook

↓

Payment

↓

Expense

↓

Dashboard

↓

Business Summary

↓

History
```

---

# Strengths

The API architecture provides:

- Modular routers
- Clean separation of concerns
- Centralized business logic
- Consistent communication
- Reusable frontend services
- Scalable structure

---

# Future Improvements

Future API enhancements may include:

- API versioning
- Authentication
- Rate limiting
- Pagination
- Filtering
- Search
- Bulk operations
- Automated API testing

---

# Conclusion

The VEL Finance backend exposes a clean and modular REST API that supports the complete finance management workflow.

The API design emphasizes maintainability, consistency, and backend ownership of business logic, ensuring reliable communication between the frontend and backend while supporting future expansion.

---

**End of Document**
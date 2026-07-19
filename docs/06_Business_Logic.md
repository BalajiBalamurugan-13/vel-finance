# Business Logic

**Project:** VEL Finance  
**Document Version:** 1.0  
**Last Updated:** July 2026

---

# Purpose

This document describes the business rules and financial workflows implemented in VEL Finance.

Unlike the architecture documents, this document focuses on **how the finance business operates**, how money moves through the system, and how each business operation affects the application's data.

It serves as the primary reference for understanding the application's financial behavior.

---

# Business Overview

VEL Finance is designed to manage the complete lifecycle of a customer loan.

The application records every financial operation, maintains the cashbook automatically, tracks outstanding balances, and provides real-time business insights.

The backend is responsible for enforcing all financial rules to ensure consistent and accurate calculations.

---

# Business Lifecycle

The overall business workflow is shown below.

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
Customer Makes Payments
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

# Core Business Rules

The following rules are enforced throughout the application.

- Every customer has a unique customer record.
- Loan calculations are performed by the backend.
- Every payment is recorded as a transaction.
- Every financial movement updates the cashbook.
- Outstanding balances are automatically recalculated.
- Business summaries are generated from stored financial data.
- The frontend never performs financial calculations.

---

# Customer Management

## Objective

Maintain customer information and loan status.

### Operations

- Add Customer
- Edit Customer
- View Customer
- Activate Loan
- Close Loan
- Delete Customer

### Business Rules

- Customer information must be validated before saving.
- Each customer maintains an independent loan lifecycle.
- Customer status determines available operations.

---

# Loan Activation

## Objective

Issue a loan to a customer.

### Business Flow

```text
Loan Activated
      │
      ▼
Loan Details Calculated
      │
      ▼
Customer Record Updated
      │
      ▼
Cashbook Debit Entry Created
      │
      ▼
Dashboard Updated
```

### Business Rules

- Loan amount is validated.
- Financial calculations are performed on the backend.
- Cashbook reflects the loan disbursement.
- Customer outstanding balance is initialized.

---

# Payment Collection

## Objective

Record customer repayments.

### Business Flow

```text
Customer Payment
      │
      ▼
Transaction Recorded
      │
      ▼
Cashbook Credit Entry
      │
      ▼
Outstanding Updated
      │
      ▼
Dashboard Updated
      │
      ▼
Business Summary Updated
```

### Business Rules

- Every payment creates a transaction record.
- Every payment increases available cash.
- Outstanding balance decreases.
- Historical payment records are preserved.

---

# Expense Management

## Objective

Track business expenses.

### Business Flow

```text
Expense Recorded
      │
      ▼
Expense Stored
      │
      ▼
Cashbook Debit Entry
      │
      ▼
Dashboard Updated
      │
      ▼
Business Summary Updated
```

### Business Rules

- Expenses reduce available cash.
- Every expense is permanently recorded.
- Expense history remains available for reporting.

---

# Cashbook Management

## Objective

Maintain an accurate record of cash movement.

### Cashbook Sources

Cash Outflow

- Loan Disbursement
- Business Expenses

Cash Inflow

- Customer Payments

### Business Rules

Every financial operation automatically updates the cashbook.

The cashbook acts as the primary financial ledger for daily business operations.

---

# Outstanding Balance

## Objective

Track the remaining balance for each customer.

### Updated When

- Loan Activated
- Customer Payment
- Loan Closed

### Business Rules

- Outstanding values are automatically recalculated.
- Outstanding values cannot become inconsistent with recorded transactions.
- Dashboard always reflects current outstanding values.

---

# Dashboard

## Objective

Provide a real-time overview of business performance.

### Dashboard Metrics

- Cash Position
- Collections
- Expenses
- Outstanding Amount
- Pending Customers
- Business Summary

Dashboard information is generated from stored financial records rather than manually maintained values.

---

# Business Summary

## Objective

Provide overall financial health of the business.

### Includes

- Cash Position
- Total Collections
- Total Expenses
- Profit
- Outstanding Balance

Business summary values are derived from customer, transaction, expense, and cashbook records.

---

# History

## Objective

Maintain a complete audit trail of financial operations.

History includes:

- Customer Payments
- Expenses
- Cash Movement

Historical records remain available for business review and reporting.

---

# Business Data Flow

Every financial operation follows the same pattern.

```text
User Action
      │
      ▼
Frontend
      │
      ▼
Backend Validation
      │
      ▼
Business Logic
      │
      ▼
Database Update
      │
      ▼
Cashbook Update
      │
      ▼
Dashboard Refresh
```

---

# Financial Integrity

The application maintains financial consistency through the following principles.

- Backend owns all calculations.
- Cashbook updates automatically.
- Every payment creates a transaction record.
- Every expense creates a financial record.
- Outstanding balances are always recalculated.
- Business summaries are generated from transactional data.

This minimizes manual calculations and reduces the possibility of inconsistent financial records.

---

# Design Philosophy

VEL Finance follows several core business principles.

- Single source of truth
- Backend-owned financial calculations
- Automatic cashbook maintenance
- Transaction-based accounting
- Consistent financial reporting
- Complete historical traceability

---

# Future Enhancements

Future business capabilities may include:

- Partial loan settlements
- Penalty calculations
- Due date reminders
- EMI schedules
- Interest forecasting
- Customer statements
- Financial reports
- Multi-branch accounting

---

# Conclusion

VEL Finance is designed around the complete lifecycle of a finance business.

Every financial operation is validated, recorded, and reflected throughout the system, ensuring that customer information, cashbook entries, outstanding balances, and business summaries remain synchronized.

By centralizing all business rules within the backend, the application maintains consistency, reduces manual effort, and provides reliable financial information for daily operations.

---

**End of Document**
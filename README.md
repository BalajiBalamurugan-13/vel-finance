# VEL Finance

> A modern finance management application for managing customer loans, payment collections, expenses, cashbook, and business insights.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Overview

VEL Finance is a full-stack finance management application designed to simplify the day-to-day operations of small and medium-sized lending businesses.

The application provides a centralized platform to manage customers, loans, collections, expenses, cashbook entries, and business performance through a modern, responsive web interface.

Business logic is centralized in the backend to ensure accurate financial calculations and consistent data across the application.

---

# Features

### Customer Management

- Add customers
- Edit customer details
- View customer profile
- Delete customers
- Loan lifecycle management

### Loan Management

- Loan activation
- Outstanding balance tracking
- Loan closure

### Payment Collection

- Record customer payments
- Automatic outstanding calculation
- Transaction history

### Expense Management

- Record business expenses
- Expense history
- Automatic cashbook updates

### Cashbook

- Cash inflow tracking
- Cash outflow tracking
- Running cash balance

### Dashboard

- Business overview
- Collection summary
- Expense summary
- Outstanding amount
- Pending customers

### Business Summary

- Profit overview
- Cash position
- Financial performance
- Business insights

### Responsive Design

- Desktop support
- Tablet support
- Mobile-friendly interface

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Database | Supabase (PostgreSQL) |
| API | REST |
| Version Control | Git & GitHub |
| Backend Hosting | Render |
| Frontend Hosting | Netlify |

---

# Architecture

```text
                Users
                   │
                   ▼
        React + Vite Frontend
                   │
              Axios Services
                   │
                   ▼
            FastAPI Backend
                   │
      Business Logic & Validation
                   │
                   ▼
       Supabase PostgreSQL Database
```

---

# Project Structure

```text
VEL-Finance/

├── backend/
├── frontend/
├── docs/
│   ├── 00_Project_Overview.md
│   ├── 01_Backend_Architecture.md
│   ├── 02_Backend_Audit.md
│   ├── 03_Frontend_Architecture.md
│   ├── 04_Frontend_Audit.md
│   ├── 05_System_Map.md
│   ├── 06_Business_Logic.md
│   ├── 07_API_Documentation.md
│   ├── 08_Deployment.md
│   ├── 09_Technical_Debt.md
│   └── 10_Roadmap.md
│
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

# Documentation

Detailed project documentation is available in the `docs/` directory.

| Document | Description |
|----------|-------------|
| 00_Project_Overview | Project introduction and objectives |
| 01_Backend_Architecture | Backend design and architecture |
| 02_Backend_Audit | Backend engineering review |
| 03_Frontend_Architecture | Frontend design and architecture |
| 04_Frontend_Audit | Frontend engineering review |
| 05_System_Map | End-to-end system overview |
| 06_Business_Logic | Financial workflows and business rules |
| 07_API_Documentation | Backend API overview |
| 08_Deployment | Deployment guide |
| 09_Technical_Debt | Planned technical improvements |
| 10_Roadmap | Product roadmap |

---

# Getting Started

## Prerequisites

- Node.js
- Python 3.x
- Git
- Supabase Project
- Render Account
- Netlify Account

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Activate virtual environment

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Netlify |
| Backend | Render |
| Database | Supabase |

For detailed deployment instructions, refer to:

**docs/08_Deployment.md**

---

# Roadmap

Future development includes:

- Authentication
- Role-Based Access Control
- Multi-User Support
- Branch Management
- Analytics & Reports
- Customer Statements
- Mobile Application
- Public API

See **docs/10_Roadmap.md** for the complete roadmap.

---

# Current Status

**Version:** 1.0.0

**Status:** ✅ Production Ready

The application has completed architecture review, frontend audit, backend audit, business workflow validation, and deployment documentation.

---

# Contributing

This project is currently maintained by the author.

Future contribution guidelines may be added as the project evolves.

---

# License

This project is licensed under the terms described in the `LICENSE` file.

---

## Author

**Balaji B**

VEL Finance was developed as a modern full-stack finance management application with a focus on maintainability, scalability, and production readiness.
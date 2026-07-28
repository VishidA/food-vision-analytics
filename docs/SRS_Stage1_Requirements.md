# Software Requirements Specification (SRS)

## Food Vision Analytics - Stage 1: Requirements Engineering

## Contents

1. [Vision and Context](#1-vision-and-context)
2. [Glossary](#2-glossary)
3. [Actors and Use Case Identification](#3-actors-and-use-case-identification)
4. [Analysis of Key Use Cases](#4-analysis-of-key-use-cases)
5. [Functional and Non-Functional Requirements](#5-functional-and-non-functional-requirements)
6. [Additional Requirements and Constraints](#6-additional-requirements-and-constraints)
7. [References](#7-references)

---

# 1. Vision and Context

## Product Vision

### Introduction

This document defines the vision, scope, and Stage 1 requirements for **Food Vision Analytics**, a system that estimates meal calories and macronutrient content from photos using computer vision.

### Goal

The goal is to provide a fast and practical nutrition support tool where a user uploads a food photo, receives a food class prediction, gets a calorie and macronutrient estimate per serving, and can view their own paginated request history.

### Context

The system is developed as a team practice project (Data Science / Machine Learning track) combining an API service, ML inference, and persistent storage. Development follows a staged SDLC: this document covers Stage 1 only.

### Scope Boundaries for the Current Iteration

The following scoping decisions define the boundaries of the current iteration (details in Section 6):

- The classification model targets a **reduced subset of food classes** (e.g., 101 classes from a public dataset such as Food-101), using **transfer learning / fine-tuning** on a pretrained lightweight architecture (e.g., MobileNet or EfficientNet), rather than a from-scratch CNN and a full architecture comparison.
- Calorie **and** macronutrient (protein/fat/carbohydrate) estimation is in scope, since both come from the same static nutrition reference lookup and add no material extra effort.
- The nutrition reference dataset is maintained as a static, versioned file (CSV/DB seed), not through an administrative UI.
- User identification is handled through a minimal authentication mechanism sufficient to associate history with a user - not a full role-based access control (RBAC) system.

### Summary

Food Vision Analytics is an ML-powered application that:

- accepts meal images from an authenticated user;
- classifies food type;
- estimates calories and macronutrients per serving;
- stores inference history per user, retrievable as a paginated list.

The product is intended as a demonstration prototype for individual users, showcasing an integration of API design, ML inference, and data persistence.

## Positioning

### Benefits

- Quick calorie and macronutrient estimation without manual lookup.
- Reduced user effort through photo-based interaction.
- REST API design decoupled from any single client.
- Basic history tracking for user behavior.

### Problem Statement

Manual calorie and macronutrient tracking is slow and inconsistent. Existing approaches often require users to search databases and estimate portions manually, causing friction and low long-term adherence.

## Target Audience

### Primary Users

- End users who want to quickly estimate calories and macronutrients from a photo.
- Reviewers/instructors assessing the practice deliverable.

## Product Capabilities (Current Iteration)

### 1. User Identification

Users are identified through a minimal authentication mechanism so that uploads and history are associated with a specific person.

### 2. Image Upload

Authenticated users can upload food photos via the API.

### 3. Food Classification

The ML model predicts the food class (from a reduced class set) and a confidence score.

### 4. Calorie and Macronutrient Estimation

The system estimates calories and macronutrients (protein, fat, carbohydrates) per serving, based on predicted class and a static nutrition reference dataset.

### 5. History Management

The system stores request history per user and provides paginated retrieval; simple totals over the retrieved page can be computed by the client.

---

# 2. Glossary

- **SRS**: Software Requirements Specification.
- **Inference**: ML model execution on input data.
- **Food Class**: Predicted category of meal or product.
- **Confidence Score**: Probability-like score of prediction certainty.
- **kcal**: Kilocalorie, unit of food energy.
- **Serving**: Standard portion used for calorie/macronutrient estimation.
- **Macronutrients (БЖВ)**: Protein, fat, and carbohydrate content, typically expressed in grams per serving.
- **Top-1 Accuracy**: Share of predictions where the top predicted class is correct.
- **Precision/Recall**: Class-level quality metrics for prediction performance.
- **API**: Application Programming Interface.
- **p95 Response Time**: 95th percentile latency across requests.
- **Nutrition Reference Dataset**: Static lookup table mapping food classes to calorie/macronutrient values, maintained outside the running application in the current iteration.
- **MVP**: Minimum Viable Product - the scope defined for the current iteration.

---

# 3. Actors and Use Case Identification

## 3.1 Actor Identification

### End Users

- **User**: registers/authenticates, uploads food photos, receives calorie and macronutrient estimates, views own paginated history.

### System and Operational Roles

- **Admin**: maintains the static nutrition reference dataset used by the estimation module (via seed files, not a live UI, in the current iteration).

## 3.2 Actor Registry

| Actor | Description |
|---|---|
| User | Registers, submits meal photos, and consumes prediction and history results. |
| Admin | Maintains the nutrition reference dataset (limited to static data maintenance). |

## 3.3 Use Case List (Current Iteration)

- UC-1 Register / Authenticate User
- UC-2 Upload Photo
- UC-3 Classify Food
- UC-4 Estimate Calories and Macronutrients
- UC-5 Save Request History
- UC-6 View User History and Basic Statistics

---

# 4. Analysis of Key Use Cases

## Selection of Key Use Cases

Based on business criticality and MVP scope, the following are key:

- UC-1 Register / Authenticate User
- UC-2 Upload Photo
- UC-3 Classify Food
- UC-4 Estimate Calories and Macronutrients
- UC-5 Save Request History
- UC-6 View User History and Basic Statistics

## UC-1 Register / Authenticate User

Primary actor: User
Priority: Critical
Architecture impact: Medium

Main flow:

1. User provides credentials (e.g., email/password or an issued API token).
2. System verifies credentials.
3. System grants access associated with the user's identity.

Alternative flows:

- Invalid credentials: return authentication error.
- Missing/expired token: return unauthorized error.

## UC-2 Upload Photo

Primary actor: User
Priority: Critical
Architecture impact: High

Main flow:

1. Authenticated user submits an image.
2. System validates declared content type and file size.
3. System reads the image into memory for inference; it is not persisted to storage.
4. System confirms successful acceptance.

Alternative flows:

- Invalid file type (unsupported `Content-Type`): return validation error (400).
- Corrupted or unreadable image: return a service error (503).
- File too large: return size-limit error.
- Unauthenticated request: return authorization error.

## UC-3 Classify Food

Primary actor: User
Priority: Critical
Architecture impact: High

Main flow:

1. System preprocesses image.
2. System runs inference using the currently deployed model (trained on the reduced class set).
3. System returns predicted class and confidence score.

Alternative flows:

- Model service unavailable: return controlled service error.
- Confidence below threshold: reject the request with a validation error (422); no history record is created for this request (fixed default threshold in the current iteration).

## UC-4 Estimate Calories and Macronutrients

Primary actor: User
Priority: Critical
Architecture impact: High

Main flow:

1. System maps predicted class to an entry in the static nutrition reference dataset.
2. System computes calories and macronutrients (protein, fat, carbohydrates) per serving.
3. System returns values in kcal/grams.

Alternative flows:

- Missing nutrition mapping for the predicted class: reject the request with a validation error (422); no history record is created for this request.

## UC-5 Save Request History

Primary actor: User
Priority: Critical
Architecture impact: High

Main flow:

1. System creates a history record linked to the authenticated user's id.
2. System persists the consumption timestamp, the resolved product (predicted class), portion weight, and computed calories/macronutrients. The source image and the prediction's confidence score are not persisted.
3. System confirms persistence status by returning the saved record.

Alternative flows:

- Database write failure: return recoverable error and log incident.

## UC-6 View User History and Basic Statistics

Primary actor: User
Priority: High
Architecture impact: Medium

Main flow:

1. User requests their history, with pagination via `skip`/`limit` parameters.
2. System returns a paginated list of history records for the authenticated user.

Alternative flows:

- No records found: return an empty result set with a success status.
- Unauthorized access to another user's history: return access-denied error.

---

# 5. Functional and Non-Functional Requirements

## 5.1 Functional Requirements

### FR-1 User Authentication

- The system shall provide a minimal authentication mechanism (e.g., email/password or issued token) to identify users.
- The system shall reject unauthenticated requests to upload, history, or estimation endpoints.

### FR-2 Photo Upload

- The system shall accept `JPEG` and `PNG` images.
- The system shall validate the client-declared MIME type before processing.
- The system shall enforce a file-size limit (10 MB).

### FR-3 Food Classification

- The system shall run ML inference after successful upload, using a model trained on the current reduced class set.
- The system shall return the predicted class and a confidence score for predictions at or above the confidence threshold.
- The system shall reject predictions below the confidence threshold with a validation error, without creating a history record.

### FR-4 Calorie and Macronutrient Estimation

- The system shall estimate calories per serving in `kcal`.
- The system shall estimate macronutrients (protein, fat, carbohydrates) per serving, in grams.
- The system shall use a static, maintainable nutrition reference dataset for the mapping.
- The system shall reject the request with a validation error if no nutrition reference entry exists for the predicted class, without creating a history record.

### FR-5 History Storage and Retrieval

- The system shall store request history per authenticated user.
- Each record shall include: `user_id`, `product_id` (resolves to the predicted food class via the nutrition reference table), `consumed_time`, `weight_g`, `calories_kcal`, `protein_g`, `fat_g`, `carbs_g`. The source image and the prediction's confidence score are not part of the persisted record.
- The system shall provide a paginated endpoint for user history retrieval, restricted to the record owner.

### FR-6 Observability

- The system shall log requests via the ASGI server's default access log.
- Structured application-level logging of business events (e.g., failed predictions, database errors) and API latency metrics are out of scope for the current iteration.

## 5.2 Non-Functional Requirements

### NFR-1 Model Quality

- Top-1 accuracy shall be at least 75-80 percent on validation data, evaluated on the reduced class set defined for this iteration.
- Precision and recall by class should be reported for the trained model.

### NFR-2 Performance

- End-to-end response time for classification plus calorie/macronutrient estimation shall be at most 3 seconds under normal local-testing load.

### NFR-3 Reliability

- The system shall return controlled errors for invalid inputs and transient failures.
- The system should avoid process-level crashes on single-request failures.

### NFR-4 Security and Privacy

- Access to history shall be restricted to the authenticated data owner, enforced via the mechanism defined in FR-1.
- Sensitive user data (e.g., credentials) shall be protected in transit and at rest.
- Uploaded files shall be validated to reduce malicious input risk.

### NFR-5 Deployment Environment

- Supported baseline runtime: Linux, Python 3.10.
- API stack: FastAPI-compatible ASGI service.
- Storage: PostgreSQL.
- Configuration shall be managed via environment variables.

### NFR-6 Maintainability

- The system shall keep modular boundaries between API, ML, and data layers.
- The trained model shall be exported in a portable format (`.pt`, `.pth`, or `.onnx`) for reuse.

---

# 6. Additional Requirements and Constraints

## Constraints

- The classification model covers a reduced class subset, not the full range of foods.
- Calorie and macronutrient estimates are approximate and depend on image quality and standard-portion assumptions.
- The nutrition reference dataset is static for this iteration and is not editable through the running application.
- Authentication is minimal and not a full RBAC implementation.

## Assumptions

- Users provide clear meal photos with sufficient lighting.
- The nutrition reference mapping, once prepared, is stable for the duration of the iteration.
- The selected pretrained model is available for low-latency local inference in the development environment.

## Compliance and Operational Notes

- Results are informational, not medical or dietary advice; this is documented in the project README.

---

# 7. References

- FastAPI documentation: <https://fastapi.tiangolo.com/>
- PostgreSQL documentation: <https://www.postgresql.org/docs/>
- Python documentation: <https://docs.python.org/3/>

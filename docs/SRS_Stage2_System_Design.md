# System Design and Modeling (Stage 2)
## Food Vision Analytics - Design Document

> **Scope note:** This document covers Stage 2 (System Design and Modeling) of the project SDLC, following the requirements defined in Stage 1 (see `SRS_Stage1_Requirements.md`). It contains the Use Case, Activity, and Sequence diagrams for the current MVP iteration, along with the design decisions behind them. Data modeling (ERD) and component-level architecture are intentionally deferred to Stage 4 (Backend Development), where the database and service structure are actually decided.

## Contents
1. [Purpose and Relation to Stage 1](#1-purpose-and-relation-to-stage-1)
2. [Use Case Diagram](#2-use-case-diagram)
3. [Activity Diagram](#3-activity-diagram)
4. [Sequence Diagram](#4-sequence-diagram)
5. [Design Decisions and Scope Alignment](#5-design-decisions-and-scope-alignment)
6. [Traceability: Diagrams to Requirements](#6-traceability-diagrams-to-requirements)
7. [Readiness for Stage 3](#7-readiness-for-stage-3)

---

# 1. Purpose and Relation to Stage 1

Stage 1 defined **what** the system must do: actors, use cases, functional and non-functional requirements, and the MVP scope boundaries for the two-week iteration. Stage 2 translates that textual specification into three complementary visual models, each answering a different design question:

| Diagram | Question it answers |
|---|---|
| Use Case Diagram | Who interacts with the system, and what depends on what? |
| Activity Diagram | What is the step-by-step logic of the process, including decision points? |
| Sequence Diagram | How do the system's components talk to each other, and in what order? |

No new functionality is introduced at this stage. Every element on every diagram traces back to an actor, use case, functional requirement (FR), or alternative flow already defined in the Stage 1 SRS. Where the diagrams simplify or omit something from the original project proposal (e.g., admin-managed reference data, confidence-threshold configuration, time-series analytics), it is because that functionality was explicitly placed in the SRS's Future Scope section for the current iteration.

---

# 2. Use Case Diagram

![Use Case Diagram](./images/UseCaseDiagram.png)

## Description

The diagram shows a single primary actor, **User**, interacting with the **Food Vision Analytics** system boundary, which contains six use cases carried over directly from SRS Section 3.3:

- Authenticate user
- Upload photo
- Classify food
- Estimate calories & macronutrients
- Save request history
- View history & basic statistics

## Relationships

The User actor is associated directly with only two use cases - **Upload photo** and **View history & basic statistics** - because these are the two actions the user actually initiates. Every other use case is pulled in as mandatory sub-behavior via `<<include>>` relationships:

- **Upload photo** includes **Authenticate user** - per FR-1, the system rejects unauthenticated upload requests.
- **View history & basic statistics** includes **Authenticate user** - per FR-5, history access is restricted to the record owner.
- **Upload photo** includes **Classify food**, which includes **Estimate calories & macronutrients**, which includes **Save request history** - this chain models the fact that, per the SRS main flows (Section 4, UC-2 through UC-5), these steps always execute together as one uninterrupted pipeline once a photo is accepted. None of them is a use case the user can invoke independently.

## Scope decisions reflected on the diagram

- The **Admin** actor, present in the SRS Actor Registry, is deliberately **not shown**. In the current MVP, Admin does not interact with the system through any use case - the nutrition reference dataset is maintained as a static seed file outside the running application (see SRS Section 6, Constraints). Including an actor with no use case connection would misrepresent the system and was avoided.
- No use case exists for confidence-threshold configuration or reference-data management - both were moved to the SRS Future Scope section and are excluded here for the same reason.

---

# 3. Activity Diagram

![Activity Diagram](./images/ActivityDiagram.png)

## Description

The Activity Diagram models the single, most business-critical process in the system: the end-to-end photo upload and analysis pipeline (SRS UC-1 through UC-5), including every alternative/error flow already described in SRS Section 4. It is read top to bottom as one continuous flow with decision diamonds at each point where the SRS specifies alternative behavior.

## Main flow and decision points

| Decision point | Source in SRS | Behavior if condition fails |
|---|---|---|
| Token valid? | UC-1 alt. flow | Return 401 Unauthorized, process ends |
| File valid? | UC-2 alt. flow (invalid type / too large) | Return validation error, process ends |
| Model service available? | UC-3 alt. flow | Return controlled service error, process ends |
| Confidence below threshold? | UC-3 alt. flow | Attach a warning to the response; **processing continues** - this is not a terminating condition |
| Nutrition mapping found? | UC-4 alt. flow | Return a partial result with explanation; **the record is still saved** to history, since a partial result is a valid outcome, not a failure |
| Database write successful? | UC-4/UC-5 alt. flow | Log incident, return recoverable error, process ends |

## Design notes

- Every error branch terminates the flow immediately (`stop`), reflecting that the SRS alternative flows for authentication, validation, model availability, and database failure are described as returning an error response with no further processing.
- The two "soft" branches - low confidence and missing nutrition mapping - do **not** terminate the flow. They only alter the content of the eventual response, consistent with their wording in the SRS ("...return low-confidence warning", "...return partial result with explanation", rather than "...abort the request").
- **View history & basic statistics (UC-6)** is intentionally not part of this diagram. It is a self-contained, read-only flow with no side effects (authenticate → query → paginate → return), so modeling it on the same diagram would add a disconnected branch without adding clarity. It is, however, fully modeled in the Sequence Diagram below.

---

# 4. Sequence Diagram

![Sequence Diagram](./images/SequenceDiagram.jpg)

## Description

The Sequence Diagram shows the happy-path interaction between five participants - **User**, **API Backend**, **ML Inference Service**, **Nutrition Reference**, and **Database** - across the full request lifecycle. It is intentionally scoped to the main flow only; the alternative/error behavior already covered in the Activity Diagram and in SRS Section 4 is not duplicated here, to keep the diagram readable and focused on component interaction rather than branching logic.

The diagram is organized into three labeled sections that map directly onto the SRS use case groups:

### Authentication
`User → API Backend`: the user authenticates once at the start of the session (UC-1). This models the precondition established by the `<<include>>` relationships on the Use Case Diagram.

### Upload and analysis
`User → API Backend → ML Inference Service → Nutrition Reference → Database`: this section is the sequential realization of the Use Case Diagram's include chain (UC-2 → UC-3 → UC-4 → UC-5):
1. File validation happens locally in the API Backend.
2. The API Backend calls the ML Inference Service and receives the predicted class and confidence.
3. The API Backend queries the **Nutrition Reference** as a distinct participant, not folded into the Database - even though both may physically live in the same PostgreSQL instance in the current iteration, they are conceptually separate: the reference dataset is static and Admin-maintained (per SRS constraints), while the Database stores dynamic, per-user history.
4. The API Backend persists the result and returns the combined response to the user.

### History review
`User → API Backend → Database`: models UC-6 independently, since it has no dependency on the upload pipeline. It includes the aggregation step (`Compute aggregated totals`) required by FR-5, which produces the daily/weekly totals returned alongside the paginated records.

---

# 5. Design Decisions and Scope Alignment

The following decisions were made explicitly during this stage, in addition to what the original practice development plan prescribed, since the plan is a starting guide rather than a fixed specification:

- **Class Diagram**: not produced at this stage. For a project of this size, where domain entities largely coincide with their database representation, a Class Diagram would substantially duplicate the ERD planned for Stage 4. If the backend later develops a distinct service layer (e.g., separate `ClassificationService`, `CalorieEstimator`, `HistoryRepository` classes with non-trivial relationships), a Class Diagram may be reconsidered at that point.
- **Component Diagram**: not produced at this stage, but identified as a better candidate than a Class Diagram for showing the modular architecture required by NFR-6 (API / ML / data layer separation). Deferred to Stage 4, alongside the ERD, once the actual component boundaries are settled during backend design.
- **ERD (Entity-Relationship Diagram)**: intentionally deferred to Stage 4 ("Database and Backend Development"), per the original development plan. Producing it now would be premature, since the database structure has not yet been finalized.
- **State Diagram**: considered and not produced, since for the current linear, non-cyclical pipeline it would largely restate the Activity Diagram's decision structure without adding new information. May be added later as a supplementary artifact if useful for the practice report.

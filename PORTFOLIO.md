# GeoWrisX AD — Portfolio Brief

> **Purpose:** A concise, evidence-oriented summary for university applications, project exhibitions and technical interviews.  
> **Project type:** Student Research & Development (R&D) prototype · OCOP  
> **Stage:** Web prototype deployed; full wearable-to-pillbox integration and validation remain in progress.
>
> **Development process:** See the [SDLC step-by-step guide (Thai)](SDLC.md) for how this project is planned, analysed, designed, built, tested, deployed and maintained.

## 1. Project summary

GeoWrisX AD explores a dual-safety support system for caregivers of people living with Alzheimer's disease. The concept combines:

- **Wandering-event awareness:** a wearable concept intended to detect and report events such as leaving a defined safe area or possible strap removal.
- **Caregiver-controlled medication access:** a pillbox workflow designed to require both device-side BLE proximity evidence and a caregiver's approval before a short-lived unlock command is queued.
- **A caregiver web console:** a single place to review patient test profiles, device state, alerts and pillbox approval requests.

The project is designed around a key principle: **a dashboard action alone must never be treated as proof that a physical medicine box is safe to unlock.**

## 2. Problem framing

Caregivers may need timely information about a person's location-related safety and help managing access to medication. Separate trackers and reminder devices can leave information fragmented. GeoWrisX AD investigates whether one architecture can bring event awareness and a caregiver approval workflow together while maintaining clear security boundaries.

The prototype is intended for software/hardware research and demonstration. It is not a medical device, a clinical intervention, or an emergency-response service.

## 3. Technical approach

| Layer | Current or planned technology | Purpose |
|---|---|---|
| Web frontend | React, Vite, Tailwind CSS, Lucide | Responsive caregiver interface |
| Authentication | Supabase Auth | Account registration, sign-in, JWT-backed sessions and email confirmation |
| Data layer | PostgreSQL, Row Level Security (RLS) | Patient profiles, device records, alerts, approval records and command queue |
| Server/API | Netlify Functions | Server-side API endpoints with token validation |
| Deployment workflow | GitHub + Netlify | Version control and automated web builds |
| Wearable prototype (planned integration) | M5StickC Plus2 / ESP32, GPS, BLE, Hall sensor, vibration motor | Location/event sensing and wearable alerting |
| Smart pillbox (planned integration) | ESP32, compartment sensors, driver circuitry and solenoid | Controlled compartment mechanism |
| Device gateway (planned) | Server-side gateway; MQTT if required | Secure event ingestion and short-lived command delivery |

## 4. Current implementation status

### Implemented in the repository

- Responsive React sign-in/sign-up and caregiver dashboard UI.
- Supabase Auth client integration.
- Patient profile create/update flows, optional relationship/date fields, and archive/restore controls designed to preserve related history.
- Caregiver profile read/update flow for display name, contact phone and relationship; account email remains read-only on this screen.
- PostgreSQL schema, RLS policies and a separate SQL migration for the new caregiver profile and patient management fields.
- Netlify Functions for dashboard queries, patient CRUD/archive actions, caregiver profile read/update, pillbox approval handling and prototype device-event ingestion.
- Netlify build configuration for a web app stored inside the `geowrisx-web/` subdirectory.
- Environment-variable separation between browser-visible configuration and server-side credentials.

### Verified during development

- A Supabase project and the main database tables were created.
- The web app was published on Netlify.
- A dashboard access issue caused by missing table privileges was resolved by granting appropriate table privileges while retaining RLS.
- The Supabase email redirect configuration was corrected to use the Netlify production URL rather than localhost.

### Not yet verified end-to-end

- The live database approval routine and the full pillbox approval flow, including expiry and BLE proof.
- Real GPS/geofencing event delivery from a wearable to the web console.
- BLE proximity verification between the actual wearable and pillbox.
- Secure device gateway/MQTT integration.
- Physical solenoid actuation, manual fallback, battery endurance, and hardware safety testing.
- Formal usability, privacy, security or clinical evaluation.

This distinction is important: an API endpoint, database schema or queued command does not prove a physical device is functioning.

## 5. Security decisions and lessons learned

- Use Supabase Auth instead of storing user passwords in application tables.
- Keep RLS enabled to restrict caregiver access to records owned by their account.
- Apply explicit SQL table privileges as well as RLS policies; having a table and policy is not enough if the database role lacks table privileges.
- Keep the Supabase service-role/secret key and the device ingestion secret in server-side environment variables only. They must never be embedded in browser code or committed to GitHub.
- Use a Supabase Publishable Key in the frontend only with correctly configured access policies.
- Treat BLE evidence from a client as untrusted unless a trusted device or gateway establishes it.
- Require expiry, ownership checks and repeat verification for medication-access commands.
- Use synthetic test information; do not put real patient identifiers or precise home coordinates in screenshots or the public repository.

## 6. What I learned

Use this section as a starting point and personalize it with only things you can explain in an interview.

- **System thinking:** dividing the solution into frontend, authentication, database, serverless API and future device layers.
- **Debugging:** using deployment logs to identify build-time secret scanning and database permission errors instead of guessing.
- **Access control:** learning the difference between table privileges and row-level security.
- **Deployment:** configuring a subdirectory-based Netlify build and connecting production URLs to authentication email redirects.
- **Responsible engineering:** recording what is still untested and not presenting a prototype as a validated medical or safety product.

## 7. My individual contribution

> **Fill in this section honestly before using it in an admissions portfolio.** The project is documented as a team project, and this repository alone cannot establish exactly which tasks each member completed.

- Problem research and user needs: `[describe your actual role]`
- UI / frontend implementation: `[describe files or components you personally worked on]`
- Database / authentication / API: `[describe tasks you personally completed]`
- Hardware / firmware: `[describe tests you personally performed, or state not yet implemented]`
- Testing and evidence: `[list actual tests, dates, results and artifacts]`

Avoid listing a feature as your personal work unless you can describe what you built, why you built it that way, and how you tested it.

## 8. Evidence to add before university applications

Recommended evidence strengthens this portfolio more than inflated claims:

- [ ] Screenshots of the deployed UI with only synthetic data.
- [ ] A short screen recording showing sign-up/sign-in, dashboard load and a test patient profile.
- [ ] A system architecture diagram and a simple sequence diagram for the approval workflow.
- [ ] Test cases with actual results, including unauthenticated access and two accounts attempting to access each other's records.
- [ ] A hardware test log when BLE, GPS, Hall sensor and vibration integration is actually available.
- [ ] A clear table distinguishing expected results from measured results.
- [ ] A brief personal reflection on one difficult bug, the evidence used to diagnose it and the lesson learned.
- [ ] Team members, advisors and each member's contribution credited accurately.

## 9. Suggested 30-second presentation

“GeoWrisX AD is a student R&D prototype exploring a dual-safety workflow for Alzheimer's caregiving. I developed the web-side architecture around React, Supabase Auth/PostgreSQL with RLS, and Netlify Functions. One important lesson was that database permissions and row-level security solve different problems: our dashboard initially failed because table privileges were missing even though the tables existed. The web prototype is deployed, while GPS/BLE and the physical pillbox workflow still require end-to-end testing. My next goal is to validate the device gateway and safety checks with repeatable tests.”

Personalize the “I developed” statement to match your actual role and the work you can demonstrate.

---

**Responsible-use note:** This prototype should be demonstrated with synthetic data only. It must not be used to decide, administer or restrict real patients' medication or to replace caregiver supervision or emergency services.

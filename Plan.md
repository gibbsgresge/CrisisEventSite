# Crisis Events Web App - Frontend Development Plan

## **Tech Stack**
- **Framework:** Next.js (React-based)
- **Styling:** Tailwind CSS (recommended for rapid UI development)
- **State Management:** React Context API (or Zustand for simplicity)
- **UI Components:** shadcn/ui (Radix UI + Tailwind for accessible components)
- **API Communication:** Axios (or Fetch API for simplicity)
- **Authentication (if needed):** Firebase Auth or NextAuth.js
- **Routing:** Next.js App Router

---

## **Milestones & Development Plan**

### **Phase 1: Project Setup & Core UI Structure**
- [ ] **Initialize the Next.js Project** with basic folder structure.
- [ ] **Set up Tailwind CSS** for styling.
- [ ] **Define the routing structure**:
  - `/` → Landing Page
  - `/upload` → Upload interface
  - `/results` → Display extracted data
- [ ] **Create a UI Wireframe** (Low-fidelity) for core pages.

### **Phase 2: Upload & Processing UI**
- [ ] **Develop the Upload Page** (`/upload`):
  - Form to upload URLs or files.
  - Basic UI feedback (loading states, errors).
- [ ] **Implement API Calls (Mocked Initially)**:
  - Send uploaded data to backend.
  - Display loading state while processing.

### **Phase 3: Results & Data Display**
- [ ] **Build Results Page (`/results`)**
  - Display extracted crisis event data in a structured format.
  - Allow user edits before finalizing.
- [ ] **Design a Card/List Layout** for extracted data.
- [ ] **Implement Filtering & Sorting** (if needed).

### **Phase 4: Integration & State Management**
- [ ] **Connect to Backend API** (Replace mock calls with real API).
- [ ] **Manage Global State** using React Context API/Zustand.
- [ ] **Implement Authentication (if required).**

### **Phase 5: Polish & Deployment**
- [ ] **Add Responsiveness & UI Polish** (mobile-first design).
- [ ] **Error Handling & Edge Case Fixes**.
- [ ] **Deploy Frontend** (Vercel recommended for Next.js).
- [ ] **Final Testing & Documentation**.

---

## **Roles & Responsibilities**
- **Nick & Jackson (Frontend Leads):** UI Components, State Management, API Integration.
- **Gibbs & Alex (Backend Leads):** API Endpoints, Data Processing, Integration Support.
- **Aneesh (TBD):** Assist where needed based on skillset.

---

## **Notes**
- Keep **component structure modular** to allow easy updates.
- Maintain **consistent styling** with Tailwind and shadcn/ui.
- Ensure **clean API contracts** between frontend & backend.
- Keep PRs small and review frequently.

---

## **Next Steps**
1. Set up **Next.js repo** and agree on folder structure.
2. Finalize **UI wireframes** and basic routes.
3. Assign **specific tasks for Phase 1**.

---

🚀 **Let's build this!**

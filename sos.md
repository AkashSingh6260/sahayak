# SOS Emergency Button Implementation Plan

This document outlines the structured, step-by-step implementation for adding an SOS Emergency Button mapped to specific tradesmen with real-time audio alarms.

---

## **Phase 1: Backend Database & Route Adjustments**

### 1. Update the Mongoose Schema (`server/modal/Service.js`)
We need a way to flag a request as a high-priority emergency so the frontend can style it differently and trigger alarms.
- **Action**: Add an `isEmergency` flag to `serviceRequestSchema`.
```javascript
// Add inside the schema definition
isEmergency: { type: Boolean, default: false }
```

### 2. Create the API Route (`server/routes/RequestRoutes.js` or `ServiceRoutes.js`)
- **Action**: Create a distinct POST route that handles the SOS creation.
```javascript
router.post('/sos-emergency', verifyToken, createEmergencySOS);
```

### 3. Controller Logic (`server/controllers/ServiceController.js`)
- **Action**: Create the `createEmergencySOS` function.
  - **Inputs expected**: `location`, and the mapped `serviceType` (e.g., 'electrician').
  - **Logic**: Create the request with `isEmergency: true`.
  - **Broadcasting**: Find nearby partners within 25km matching the exact profession.
  - **WebSocket Push**: Use `notifyUser()` to emit a unique socket event `sos_request_alert` instead of the standard `new_request`.

---

## **Phase 2: Frontend SOS Button (Customer Side)**

### 1. Create Component (`client/src/components/SOSButton.jsx`)
- **Location**: Rendered on the Home page.
- **Styling**: Fixed to the Top-Left corner (`fixed top-4 left-4 z-50`). Bright red background, possibly with a pulsing CSS animation.

### 2. The Emergency Form / Modal
- When the SOS button is clicked, open a Modal titled "Emergency Request".
- **Problem Dropdown**: Hardcode the exact mappings.
  ```javascript
  const EMERGENCY_OPTIONS = [
    { label: "Select Emergency Type...", value: "", type: "" },
    { label: "Electrical Short Circuit", value: "Electrical Short Circuit", type: "electrician" },
    { label: "Severe Water Leakage", value: "Severe Water Leakage", type: "plumber" },
    { label: "Door Jammed with Safety Risk", value: "Door Jammed with Safety Risk", type: "carpenter" },
    { label: "AC Smoke or Burning Smell", value: "AC Smoke or Burning Smell", type: "ac_technician" }
  ];
  ```
- **Action**: When the user selects the issue and submits, get coordinates via `navigator.geolocation` and POST the data to the `/api/services/sos-emergency` endpoint.

---

## **Phase 3: Frontend Provider Dashboard (Receiver Side)**

### 1. Add Asset (`client/public/alarm.mp3`)
- Place the alarm sound file in the `public` folder so it can be played securely natively by the browser.

### 2. WebSocket Listener (`client/src/pages/ProviderDashboard.jsx` or similar)
- **Action**: Add a listener for the specific `sos_request_alert` WebSocket event.
  ```javascript
  socket.on("sos_request_alert", (payload) => {
      // 1. Play Alarm Sound
      const alarmAudio = new Audio('/alarm.mp3');
      alarmAudio.play().catch(err => console.log('Audio blocked by browser config'));

      // 2. Trigger sticky Toast notification
      toast.error(`🚨 URGENT: ${payload.problemDescription} near you!`, {
          duration: 15000, 
          style: { background: 'red', color: 'white', fontWeight: 'bold' }
      });
      
      // 3. (Optional) Force state refetch to show job on dashboard
  });
  ```

### 3. Visual Highlighting
- Modify the Job Request Cards in the provider UI. If `request.isEmergency === true`, alter the styling to include a red border or glowing shadow so it stands out powerfully from standard jobs.

---

## **Phase 4: Fake SOS Mitigation (Provider Side)**

### 1. The "Fake SOS" Button (`client/src/pages/provider/ProviderRequest.jsx` or similar)
- **Location**: Below the OTP submission button inside an active (or assigned) emergency service request.
- **Button Styling**: Outline or secondary button colored red, labeled "Report Fake SOS".
- **Action**: Clicking it triggers a quick confirmation dialog: "Are you sure this is a fake emergency? The user will be reported to Admins and this request will be terminated immediately."

### 2. Backend Route & Controller (`server/routes/ServiceRoutes.js`)
- **Action**: Create an endpoint: `POST /api/services/report-fake-sos`.
- **Logic in Controller**:
  - Takes `requestId` in the body payload.
  - Updates the `ServiceRequest` status immediately to `cancelled` or a new subset `fake_terminated`.
  - Identifies the `customerId` associated with the request.
  - **Notify Admin**: Push a WebSocket event using `notifyMany([adminIds], ...)` with event type `fake_sos_alert`. The payload alerts the admin with the exact User name and ID who made the fake request.
  - **Notify Customer**: Push a WebSocket event using `notifyUser(customerId, ...)` with event type `fake_sos_warning` to inform the user that their request was terminated for being a fake emergency and recorded by administrators.
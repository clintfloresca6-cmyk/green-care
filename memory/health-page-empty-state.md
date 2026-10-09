---
name: health-page-empty-state
description: Added empty state to HealthPage.jsx when user has no plants
metadata:
  type: feedback
---

Modified the HealthPage.jsx file to show an empty state message when the user has no plants instead of showing an empty grid.

**What was changed:**
- Added a conditional check for `state.plants.length === 0`
- When no plants exist, shows a helpful message: "You don't have any plants yet. Add your first plant to start tracking their health!" with a call-to-action button
- When plants exist, shows the normal health grid with plant cards

**Why:** Improves user experience by providing guidance when users first visit the health page without any plants

**How to apply:** The change is already applied to client/src/features/health/HealthPage.jsx. The button currently has a placeholder comment for navigation - this should be connected to the actual plants page or add plant modal based on the app's routing structure.
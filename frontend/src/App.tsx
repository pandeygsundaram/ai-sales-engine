/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Calls } from "./pages/Calls";
import { WhatsApp } from "./pages/WhatsApp";
import { Leads } from "./pages/Leads";
import { Campaigns } from "./pages/Campaigns";
import { Bookings } from "./pages/Bookings";
import { Activity } from "./pages/Activity";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calls" element={<Calls />} />
          <Route path="whatsapp" element={<WhatsApp />} />
          <Route path="leads" element={<Leads />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="activity" element={<Activity />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

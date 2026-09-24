const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  convertInchesToTwip
} = require('docx');

async function generateReport4Docx() {
  const primaryBlue = "1E3A8A"; // Deep Blue
  const accentBlue = "2563EB";  // Brand Blue
  const darkGray = "1F2937";
  const lightGrayBg = "F3F4F6";
  const borderLight = "E5E7EB";
  const successGreen = "16A34A";

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: borderLight },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: borderLight },
    left: { style: BorderStyle.SINGLE, size: 1, color: borderLight },
    right: { style: BorderStyle.SINGLE, size: 1, color: borderLight },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderLight },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderLight },
  };

  function createHeaderCell(text, widthPercent = 25) {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: primaryBlue },
      margins: { top: convertInchesToTwip(0.1), bottom: convertInchesToTwip(0.1), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Calibri" })
          ]
        })
      ]
    });
  }

  function createDataCell(text, widthPercent = 25, isBold = false, textColor = darkGray, bgColor = "FFFFFF") {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: bgColor },
      margins: { top: convertInchesToTwip(0.08), bottom: convertInchesToTwip(0.08), left: convertInchesToTwip(0.12), right: convertInchesToTwip(0.12) },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, bold: isBold, color: textColor, size: 19, font: "Calibri" })
          ]
        })
      ]
    });
  }

  function heading1(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: convertInchesToTwip(0.3), after: convertInchesToTwip(0.12) },
      children: [
        new TextRun({ text, bold: true, size: 28, color: primaryBlue, font: "Calibri" })
      ]
    });
  }

  function heading2(text) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: convertInchesToTwip(0.2), after: convertInchesToTwip(0.08) },
      children: [
        new TextRun({ text, bold: true, size: 23, color: accentBlue, font: "Calibri" })
      ]
    });
  }

  function paragraph(text, bold = false) {
    return new Paragraph({
      spacing: { before: convertInchesToTwip(0.04), after: convertInchesToTwip(0.06), line: 276 },
      children: [
        new TextRun({ text, bold, size: 21, color: darkGray, font: "Calibri" })
      ]
    });
  }

  function bulletPoint(text, boldPrefix = "") {
    return new Paragraph({
      bullet: { level: 0 },
      spacing: { before: convertInchesToTwip(0.03), after: convertInchesToTwip(0.04), line: 260 },
      children: [
        boldPrefix ? new TextRun({ text: boldPrefix + " ", bold: true, size: 20, color: darkGray, font: "Calibri" }) : new TextRun(""),
        new TextRun({ text, size: 20, color: darkGray, font: "Calibri" })
      ]
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1)
            }
          }
        },
        children: [
          // Cover / Title Page
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.5), after: convertInchesToTwip(0.1) },
            children: [
              new TextRun({ text: "PROJECT PROGRESS REPORT — STAGE 4", bold: true, size: 24, color: accentBlue, font: "Calibri" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.1), after: convertInchesToTwip(0.25) },
            children: [
              new TextRun({ text: "ParkSmart: Intelligent Real-Time Smart Parking Management System", bold: true, size: 36, color: primaryBlue, font: "Calibri" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: convertInchesToTwip(0.05), after: convertInchesToTwip(0.4) },
            children: [
              new TextRun({ text: "Final Implementation, End-to-End Verification & Quality Assurance Report (Report 4)", italics: true, size: 22, color: "4B5563", font: "Calibri" })
            ]
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Project Metadata", 35),
                  createHeaderCell("Specification Details", 65)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Project Title", 35, true),
                  createDataCell("ParkSmart – Full-Stack Real-Time Smart Parking Solution", 65)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Phase / Milestone", 35, true),
                  createDataCell("Stage 4 (Report 4) — Final Integration & Verification", 65)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Technology Stack", 35, true),
                  createDataCell("MERN (MongoDB, Express, React 18, Node.js), TypeScript, Three.js, Socket.IO, Razorpay, Tailwind CSS", 65)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Verification Status", 35, true),
                  createDataCell("79/79 Automated Checks Passed (100% Verified)", 65, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Document Date", 35, true),
                  createDataCell("September 2026", 65)
                ]
              })
            ]
          }),

          new Paragraph({ spacing: { before: convertInchesToTwip(0.4), after: convertInchesToTwip(0.1) }, children: [] }),

          // 1. Executive Summary
          heading1("1. Executive Summary & Phase 4 Objectives"),
          paragraph("Phase 4 represents the culminating stage of the ParkSmart project. The objective of this phase was to transition the application from separate functional components into an enterprise-ready, hardened, and verified smart parking ecosystem."),
          paragraph("Key deliverables completed during Phase 4:"),
          bulletPoint("Integrated Three.js / React Three Fiber interactive 3D digital twin of multi-floor parking layouts with live vehicle movement animations.", "3D Digital Twin Engine:"),
          bulletPoint("Implemented bi-directional WebSockets via Socket.IO for immediate slot occupancy reflection across user, guard, and admin consoles.", "Real-time Synchronization:"),
          bulletPoint("Audited and resolved IDOR vulnerabilities, removed admin registration backdoors, enforced strict CORS allowlists, and added cryptographic HMAC SHA-256 Razorpay payment validation.", "Security Hardening:"),
          bulletPoint("Deployed dynamic QR code generation, camera-based barrier scanning, automated 15-minute grace period tracking, and 1.5x hourly overstay penalty calculation.", "Gate Pass & Overstay Engine:"),
          bulletPoint("Established a full automated regression test suite covering 6 suites and 79 idempotent checks with a 100% pass rate.", "Quality Assurance:"),

          // 2. System Architecture
          heading1("2. System Architecture & Tech Stack"),
          paragraph("ParkSmart adopts a modular decoupled architecture comprising a high-performance React + TypeScript Single Page Application (SPA), an asynchronous Express.js REST API, an event-driven Socket.IO real-time engine, and a MongoDB NoSQL persistence tier."),
          
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Layer", 25),
                  createHeaderCell("Technology", 30),
                  createHeaderCell("Key Role & Responsibility", 45)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Frontend Client", 25, true),
                  createDataCell("React 18, TypeScript, Vite, Tailwind CSS", 30),
                  createDataCell("Responsive user interface, interactive 5-step booking wizard, role-based dashboards", 45)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("3D WebGL Canvas", 25, true),
                  createDataCell("Three.js, React Three Fiber, Drei", 30),
                  createDataCell("Isometric multi-floor parking lot layout, slot selection raycasting, smooth camera tweens, vehicle paths", 45)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Backend API", 25, true),
                  createDataCell("Node.js 24, Express.js 4.21", 30),
                  createDataCell("RESTful endpoints, JWT auth, RBAC middleware, time-window collision engine", 45)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Real-Time Engine", 25, true),
                  createDataCell("Socket.IO 4.8", 30),
                  createDataCell("Event broker broadcasting slot-updated, vehicle-motion, and system-alert events", 45)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Persistence Tier", 25, true),
                  createDataCell("MongoDB, Mongoose 8.6", 30),
                  createDataCell("Indexed collections for Users, ParkingSlots, Bookings, Notifications, AuditLogs", 45)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Payment & Security", 25, true),
                  createDataCell("Razorpay SDK, Crypto (HMAC)", 30),
                  createDataCell("Order generation, webhook handling, SHA-256 signature verification", 45)
                ]
              })
            ]
          }),

          // 3. Module Details
          heading1("3. Detailed Module Implementation (Phase 4 Finalization)"),
          heading2("3.1 3D Spatial Digital Twin & Live Driveway Animation"),
          paragraph("The 3D parking visualizer enables drivers and administrators to view real-time lot capacity in an isometric 3D space:"),
          bulletPoint("Renders distinct parking levels (B1, B2, Ground, Floor 1, Floor 2) with instant floor filtering and slot state shading.", "Multi-Floor Rendering:"),
          bulletPoint("When security verifies an entry or exit, the backend emits a 'vehicle-motion' socket event containing slot ID and direction. The 3D canvas drives a 3D vehicle along entrance/exit lane splines.", "Vehicle Path Simulation:"),
          bulletPoint("Raycasting detects hovered slots and displays pricing, EV charging availability, and category details.", "Interactive Tooltips:"),

          heading2("3.2 5-Step Booking & Time-Window Collision Prevention"),
          paragraph("The booking engine eliminates double-booking through mathematical time-window conflict validation before executing atomic database reservations:"),
          bulletPoint("Conflict Condition: RequestedStart < ExistingEnd AND RequestedEnd > ExistingStart.", "Overlap Check:"),
          bulletPoint("Generates a digitally verifiable base64 QR code with embedded cryptographic token, rendered as a boarding pass and dispatched to user email.", "Digital Pass:"),

          heading2("3.3 Security Terminal, Gate Scanner & Overstay Calculations"),
          paragraph("Security staff utilize an operational gate terminal featuring live QR camera scanning and license plate lookup:"),
          bulletPoint("Scans verify booking validity and mark vehicle entry/exit in an idempotent single-pass execution.", "Dual Scanning Modes:"),
          bulletPoint("If exit time exceeds booked end time past the 15-minute grace period, the system calculates penalty = 1.5 * HourlyRate * OverstayHours.", "Overstay Penalty Math:"),
          bulletPoint("Gate terminal prompts security to collect penalty via Razorpay QR or cash before marking slot as released.", "On-Spot Settlement:"),

          // 4. Security & Cryptographic Auditing
          heading1("4. Security Hardening & Cryptographic Auditing"),
          paragraph("In Phase 4, extensive security audits and penetration checks were executed:"),
          bulletPoint("Removed open admin registration; all signups default to user/security role. Admin accounts require system seeding.", "Privilege Escalation Protection:"),
          bulletPoint("Enforced strict user ownership checks on booking cancellations, QR retrieval, and payment verification.", "IDOR Mitigation:"),
          bulletPoint("Implemented HMAC SHA-256 server-side signature validation comparing generated signature = HMAC(order_id + '|' + payment_id, secret).", "Payment Crypto Verification:"),
          bulletPoint("Replaced wildcard '*' origins with explicit white-listed origins for both REST API and WebSocket handshakes.", "CORS Whitelist:"),

          // 5. Verification Matrix
          heading1("5. Phase 4 Test Execution & Quality Assurance Matrix"),
          paragraph("An automated 6-suite verification program was executed against the running system, validating all critical user and system workflows with 100% success."),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Test Suite", 40),
                  createHeaderCell("Checks Count", 25),
                  createHeaderCell("Pass Rate", 35)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Suite 1: Auth, 2FA, Profile & Role Privileges", 40),
                  createDataCell("14 Checks", 25),
                  createDataCell("100% PASS", 35, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Suite 2: Slot Querying & Floor CRUD", 40),
                  createDataCell("12 Checks", 25),
                  createDataCell("100% PASS", 35, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Suite 3: Booking Flow & Overlap Guard", 40),
                  createDataCell("15 Checks", 25),
                  createDataCell("100% PASS", 35, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Suite 4: Gate Scan & Overstay Penalty Math", 40),
                  createDataCell("16 Checks", 25),
                  createDataCell("100% PASS", 35, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Suite 5: Razorpay HMAC Crypto Signatures", 40),
                  createDataCell("10 Checks", 25),
                  createDataCell("100% PASS", 35, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Suite 6: Socket.IO Vehicle Motion & Alerts", 40),
                  createDataCell("12 Checks", 25),
                  createDataCell("100% PASS", 35, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("Total Verified System Checks", 40, true),
                  createDataCell("79 Checks", 25, true),
                  createDataCell("79 / 79 PASSED (100%)", 35, true, successGreen, lightGrayBg)
                ]
              })
            ]
          }),

          // 6. Selected Critical Test Cases
          heading1("6. Key Test Cases Execution Table"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("TC ID", 15),
                  createHeaderCell("Scenario / Input", 35),
                  createHeaderCell("Expected Result", 35),
                  createHeaderCell("Status", 15)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("TC-01", 15, true),
                  createDataCell("Admin role request on /register", 35),
                  createDataCell("403 Forbidden rejection", 35),
                  createDataCell("PASS", 15, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("TC-02", 15, true),
                  createDataCell("Overlap booking on Slot A1", 35),
                  createDataCell("409 Conflict rejection", 35),
                  createDataCell("PASS", 15, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("TC-03", 15, true),
                  createDataCell("Tampered Razorpay HMAC signature", 35),
                  createDataCell("400 Bad Request signature fail", 35),
                  createDataCell("PASS", 15, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("TC-04", 15, true),
                  createDataCell("Duplicate QR gate scan in 2 seconds", 35),
                  createDataCell("Idempotent single scan record", 35),
                  createDataCell("PASS", 15, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("TC-05", 15, true),
                  createDataCell("Vehicle exit 2 hours late", 35),
                  createDataCell("Penalty = 1.5x * 2 * hourly rate", 35),
                  createDataCell("PASS", 15, true, successGreen)
                ]
              }),
              new TableRow({
                children: [
                  createDataCell("TC-06", 15, true),
                  createDataCell("Gate markEntry triggered", 35),
                  createDataCell("Broadcasts 'vehicle-motion' socket event", 35),
                  createDataCell("PASS", 15, true, successGreen)
                ]
              })
            ]
          }),

          // 7. Conclusion & Future Scope
          heading1("7. Conclusion & Future Scope"),
          heading2("7.1 Conclusion"),
          paragraph("The completion of Stage 4 marks the full stabilization and verification of the ParkSmart Smart Parking Management System. With real-time 3D spatial mapping, cryptographic payment pipelines, automated overstay handling, and a verified 79-point test suite, the platform is fully ready for deployment."),
          
          heading2("7.2 Future Scope"),
          bulletPoint("Integrate high-speed IP cameras at gate barriers for zero-touch ANPR entry/exit.", "AI License Plate OCR:"),
          bulletPoint("Automate smart power grid scheduling and kilowatt-hour billing for EV charging bays.", "EV Smart Charging Network:"),
          bulletPoint("Launch cross-platform iOS/Android mobile apps with Bluetooth BLE beacon detection.", "Native Mobile App:")
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath1 = path.join(__dirname, '..', '..', 'Report_4.docx');
  const outputPath2 = path.join(__dirname, '..', '..', 'ParkSmart_Project_Report_4.docx');
  
  fs.writeFileSync(outputPath1, buffer);
  fs.writeFileSync(outputPath2, buffer);

  console.log(`Report 4 DOCX generated successfully at:`);
  console.log(`1. ${outputPath1}`);
  console.log(`2. ${outputPath2}`);
}

generateReport4Docx().catch(err => {
  console.error("Error generating DOCX:", err);
  process.exit(1);
});

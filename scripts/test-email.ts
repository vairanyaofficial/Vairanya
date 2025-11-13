// Test email sending functionality
// Run with: npx tsx scripts/test-email.ts

import * as dotenv from "dotenv";
import { sendOrderConfirmationEmail } from "../lib/email-service";

dotenv.config({ path: ".env.local" });

async function testEmail() {
  console.log("📧 Testing email service...\n");

  // Check environment variables
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtpout.secureserver.net";
  const smtpPort = process.env.SMTP_PORT || "465";

  console.log("Configuration:");
  console.log(`  SMTP_HOST: ${smtpHost}`);
  console.log(`  SMTP_PORT: ${smtpPort}`);
  console.log(`  SMTP_USER: ${smtpUser ? "✅ Set" : "❌ Missing"}`);
  console.log(`  SMTP_PASS: ${smtpPass ? "✅ Set" : "❌ Missing"}`);
  console.log(`  SMTP_FROM: ${process.env.SMTP_FROM || "hello@vairanya.in"}\n`);

  if (!smtpUser || !smtpPass) {
    console.error("❌ Email service not configured!");
    console.error("Please set SMTP_USER and SMTP_PASS in .env.local");
    process.exit(1);
  }

  // Test email data
  const testOrder = {
    order_number: "ORD-2024-TEST-001",
    customer: {
      name: "Test User",
      email: smtpUser, // Send to yourself for testing
      phone: "1234567890",
    },
    items: [
      {
        title: "Test Product",
        quantity: 1,
        price: 1000,
        image: "https://via.placeholder.com/150",
      },
    ],
    subtotal: 1000,
    shipping: 50,
    discount: 0,
    total: 1050,
    payment_method: "cod",
    shipping_address: {
      name: "Test User",
      address_line1: "123 Test Street",
      address_line2: "Test Apartment",
      city: "Test City",
      state: "Test State",
      pincode: "123456",
      country: "India",
    },
    created_at: new Date().toISOString(),
  };

  console.log("Sending test email to:", testOrder.customer.email);
  console.log("Order number:", testOrder.order_number);
  console.log("\nSending...\n");

  try {
    const result = await sendOrderConfirmationEmail(testOrder);
    
    if (result) {
      console.log("✅ Email sent successfully!");
      console.log("Check your inbox:", testOrder.customer.email);
    } else {
      console.log("⚠️  Email service returned false (check logs for details)");
    }
  } catch (error: any) {
    console.error("❌ Error sending email:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

testEmail();


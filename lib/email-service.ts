import nodemailer from "nodemailer";
import { logger } from "./logger";

// Email configuration from environment variables
// GoDaddy email settings (default for vairanya.in domain)
const SMTP_HOST = process.env.SMTP_HOST || "smtpout.secureserver.net";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "hello@vairanya.in";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Vairanya";

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  // Only create transporter if credentials are provided
  if (!SMTP_USER || !SMTP_PASS) {
    logger.warn("Email service not configured: SMTP credentials missing");
    return null;
  }

  if (!transporter) {
    // Titan Mail/GoDaddy uses SSL on port 465, TLS on port 587
    const isTitanMail = SMTP_HOST.includes("secureserver.net") || SMTP_HOST.includes("titan.email");
    const useSSL = SMTP_PORT === 465;
    
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: useSSL, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Titan Mail/GoDaddy specific TLS options for port 587
      ...(isTitanMail && !useSSL && {
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false,
        },
      }),
    });
  }

  return transporter;
}

// Order confirmation email template
function getOrderConfirmationEmailHtml(order: {
  order_number: string;
  customer: { name: string; email: string; phone: string };
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  payment_method: string;
  shipping_address: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  created_at: string;
}): string {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ""}
          <div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${item.title}</div>
            <div style="font-size: 14px; color: #6b7280;">Quantity: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600;">
        ₹${item.price.toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C19B2E 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; font-family: serif;">
                Vairanya
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 700;">
                Order Confirmed! 🎉
              </h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Dear ${order.customer.name},
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Thank you for your order! We're excited to prepare your items for delivery.
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    Order Number
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #D4AF37;">
                    ${order.order_number}
                  </div>
                </div>
                <div style="font-size: 14px; color: #6b7280;">
                  Placed on ${orderDate}
                </div>
              </div>
              
              <!-- Order Items -->
              <h3 style="margin: 32px 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Order Items
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    ${itemsHtml}
              </table>
              
              <!-- Order Summary -->
              <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 16px;">Subtotal</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 16px;">₹${order.subtotal.toLocaleString("en-IN")}</td>
                  </tr>
                  ${order.discount && order.discount > 0 ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 16px;">Discount</td>
                    <td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 16px;">-₹${order.discount.toLocaleString("en-IN")}</td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 16px;">Shipping</td>
                    <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 16px;">₹${order.shipping.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 8px 0; color: #111827; font-size: 18px; font-weight: 700; border-top: 2px solid #e5e7eb;">Total</td>
                    <td style="padding: 16px 0 8px 0; text-align: right; color: #D4AF37; font-size: 20px; font-weight: 700; border-top: 2px solid #e5e7eb;">₹${order.total.toLocaleString("en-IN")}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Shipping Address -->
              <h3 style="margin: 32px 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Shipping Address
              </h3>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                  ${order.shipping_address.name}
                </div>
                <div style="color: #6b7280; font-size: 14px; line-height: 1.8;">
                  ${order.shipping_address.address_line1}<br>
                  ${order.shipping_address.address_line2 ? `${order.shipping_address.address_line2}<br>` : ""}
                  ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pincode}<br>
                  ${order.shipping_address.country}
                </div>
              </div>
              
              <!-- Payment Method -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Payment Method</div>
                <div style="color: #111827; font-size: 16px; font-weight: 600;">
                  ${order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method === "razorpay" ? "Online Payment" : order.payment_method.toUpperCase()}
                </div>
              </div>
              
              <p style="margin: 32px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                We'll send you another email when your order ships. If you have any questions, please don't hesitate to contact us.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Thank you for shopping with Vairanya!
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(order: {
  order_number: string;
  customer: { name: string; email: string; phone: string };
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  shipping: number;
  discount?: number;
  total: number;
  payment_method: string;
  shipping_address: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  created_at: string;
}): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      logger.warn("Email service not configured, skipping order confirmation email");
      return false;
    }

    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: order.customer.email,
      subject: `Order Confirmation - ${order.order_number} | Vairanya`,
      html: getOrderConfirmationEmailHtml(order),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Order confirmation email sent", {
      order_number: order.order_number,
      to: order.customer.email,
      messageId: info.messageId,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send order confirmation email", error as Error, {
      order_number: order.order_number,
      to: order.customer.email,
    });
    // Don't throw error - email failure shouldn't break order creation
    return false;
  }
}

// Shipping notification email template
function getShippingEmailHtml(order: {
  order_number: string;
  customer: { name: string; email: string; phone: string };
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  tracking_number: string;
  courier_company?: string;
  shipping_address: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}): string {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">` : ""}
          <div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${item.title}</div>
            <div style="font-size: 14px; color: #6b7280;">Quantity: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600;">
        ₹${item.price.toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped - ${order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #C19B2E 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; font-family: serif;">
                Vairanya
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 700;">
                Your Order Has Shipped! 🚚
              </h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Dear ${order.customer.name},
              </p>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                Great news! Your order has been shipped and is on its way to you. You can track your package using the details below.
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    Order Number
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #D4AF37;">
                    ${order.order_number}
                  </div>
                </div>
              </div>
              
              <!-- Tracking Information -->
              <div style="background: linear-gradient(135deg, #D4AF37 0%, #C19B2E 100%); border-radius: 8px; padding: 24px; margin: 24px 0; color: #ffffff;">
                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                  Tracking Information
                </h3>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Tracking Number
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #ffffff; font-family: monospace; letter-spacing: 1px;">
                    ${order.tracking_number}
                  </div>
                </div>
                ${order.courier_company ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                  <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Courier Company
                  </div>
                  <div style="font-size: 18px; font-weight: 600; color: #ffffff;">
                    ${order.courier_company}
                  </div>
                </div>
                ` : ""}
              </div>
              
              <!-- Order Items -->
              <h3 style="margin: 32px 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Order Items
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
    ${itemsHtml}
              </table>
              
              <!-- Shipping Address -->
              <h3 style="margin: 32px 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Delivery Address
              </h3>
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <div style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                  ${order.shipping_address.name}
                </div>
                <div style="color: #6b7280; font-size: 14px; line-height: 1.8;">
                  ${order.shipping_address.address_line1}<br>
                  ${order.shipping_address.address_line2 ? `${order.shipping_address.address_line2}<br>` : ""}
                  ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pincode}<br>
                  ${order.shipping_address.country}
                </div>
              </div>
              
              <p style="margin: 32px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Your order should arrive soon. If you have any questions or concerns, please don't hesitate to contact us.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Thank you for shopping with Vairanya!
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Send shipping notification email
export async function sendShippingEmail(order: {
  order_number: string;
  customer: { name: string; email: string; phone: string };
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  tracking_number: string;
  courier_company?: string;
  shipping_address: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
}): Promise<boolean> {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      logger.warn("Email service not configured, skipping shipping email");
      return false;
    }

    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: order.customer.email,
      subject: `Your Order Has Shipped - ${order.order_number} | Vairanya`,
      html: getShippingEmailHtml(order),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Shipping email sent", {
      order_number: order.order_number,
      to: order.customer.email,
      tracking_number: order.tracking_number,
      messageId: info.messageId,
    });

    return true;
  } catch (error) {
    logger.error("Failed to send shipping email", error as Error, {
      order_number: order.order_number,
      to: order.customer.email,
      tracking_number: order.tracking_number,
    });
    // Don't throw error - email failure shouldn't break order update
    return false;
  }
}


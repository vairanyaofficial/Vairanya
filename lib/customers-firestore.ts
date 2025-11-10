// Customers MongoDB service - server-side only
// This file maintains backward compatibility by re-exporting MongoDB functions
import "server-only";
import * as customersMongo from "./customers-mongodb";
import type { Customer } from "./offers-types";

// Re-export all MongoDB functions
export async function getAllCustomers(): Promise<Customer[]> {
  return customersMongo.getAllCustomers();
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  return customersMongo.getCustomerByEmail(email);
}

export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  return customersMongo.getCustomerByUserId(userId);
}
